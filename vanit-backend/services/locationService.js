const pool = require('../config/db');
const redisClient = require('../config/redis');

class LocationService {
    constructor() {
        this.activeCaptains = new Map(); // captainId -> location data
        this.notificationCooldowns = new Map(); // stopId -> last notification time
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    // Update captain location and broadcast to subscribers
    async updateCaptainLocation(captainId, latitude, longitude, timestamp) {
        try {
            // Store in memory for quick access
            const locationData = {
                captainId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                timestamp: timestamp || new Date().toISOString()
            };

            this.activeCaptains.set(captainId, locationData);

            await redisClient.set(`captain:${captainId}:location`, JSON.stringify(locationData), 300);

            // Get captain's route information
            const [captainData] = await pool.query(
                'SELECT route_name FROM captains WHERE id = ?',
                [captainId]
            );

            if (captainData.length > 0) {
                const routeName = captainData[0].route_name;
                
                // Broadcast to route subscribers
                await redisClient.publish(`route:${routeName}:locations`, {
                    type: 'location_update',
                    data: locationData
                });

                // Check for nearby stops and trigger notifications
                await this.checkNearbyStops(captainId, latitude, longitude, routeName);
            }

            return true;
        } catch (error) {
            console.error('Error updating captain location:', error);
            return false;
        }
    }

    // Check if captain is near any stops and trigger notifications
    async checkNearbyStops(captainId, latitude, longitude, routeName) {
        try {
            // Get all stops for the route
            const [routeData] = await pool.query(
                'SELECT id FROM routes WHERE route_name = ?',
                [routeName]
            );

            if (routeData.length === 0) return;

            const routeId = routeData[0].id;
            const [stops] = await pool.query(
                'SELECT id, stop_name FROM stops WHERE route_id = ?',
                [routeId]
            );

            const notifyDistance = parseFloat(process.env.NOTIFY_DISTANCE_KM) || 2;
            const cooldownMs = parseInt(process.env.NOTIFICATION_COOLDOWN_MS) || 1800000; // 30 minutes

            for (const stop of stops) {
                // For demo purposes, we'll use mock stop coordinates
                // In production, you'd store actual coordinates for each stop
                const stopLat = 33.6844 + (Math.random() - 0.5) * 0.1; // Mock coordinates around Islamabad
                const stopLon = 73.0479 + (Math.random() - 0.5) * 0.1;

                const distance = this.calculateDistance(latitude, longitude, stopLat, stopLon);

                if (distance <= notifyDistance) {
                    // Check cooldown
                    const lastNotification = this.notificationCooldowns.get(`${stop.id}`);
                    const now = Date.now();

                    if (!lastNotification || (now - lastNotification) > cooldownMs) {
                        // Trigger notification
                        await this.triggerStopNotification(captainId, stop, distance, routeName);
                        this.notificationCooldowns.set(`${stop.id}`, now);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking nearby stops:', error);
        }
    }

    // Trigger notification for students at a specific stop
    async triggerStopNotification(captainId, stop, distance, routeName) {
        try {
            // Get captain details
            const [captainData] = await pool.query(
                'SELECT first_name, last_name FROM captains WHERE id = ?',
                [captainId]
            );

            if (captainData.length === 0) return;

            const captainName = `${captainData[0].first_name} ${captainData[0].last_name}`;

            // Get all students assigned to this stop and route
            const [students] = await pool.query(
                'SELECT id, first_name, last_name, registration_number FROM students WHERE route_name = ? AND stop_name = ?',
                [routeName, stop.stop_name]
            );

            // Create notification payload
            const notification = {
                type: 'bus_approaching',
                data: {
                    captainId,
                    captainName,
                    stopId: stop.id,
                    stopName: stop.stop_name,
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                    routeName,
                    timestamp: new Date().toISOString(),
                    message: `🚍 Your bus (${captainName}) is ${Math.round(distance * 10) / 10} km away—be at ${stop.stop_name} soon!`
                }
            };

            // Broadcast notification to route subscribers
            await redisClient.publish(`route:${routeName}:notifications`, notification);

            // Store notification in Redis for students who might be offline
            for (const student of students) {
                await redisClient.set(
                    `student:${student.id}:last_notification`,
                    notification.data,
                    3600 // 1 hour TTL
                );
            }

            console.log(`Notification sent for stop ${stop.stop_name}: ${notification.data.message}`);
        } catch (error) {
            console.error('Error triggering stop notification:', error);
        }
    }

    // Get all active captain locations for a route
    async getRouteLocations(routeName) {
        try {
            const [captains] = await pool.query(
                'SELECT id, first_name, last_name FROM captains WHERE route_name = ? AND status = "active"',
                [routeName]
            );

            const locations = [];
            for (const captain of captains) {
                const location = this.activeCaptains.get(captain.id);
                if (location) {
                    locations.push({
                        ...location,
                        captainName: `${captain.first_name} ${captain.last_name}`
                    });
                }
            }

            return locations;
        } catch (error) {
            console.error('Error getting route locations:', error);
            return [];
        }
    }

    // Get captain's current location
    async getCaptainLocation(captainId) {
        try {
            let location = this.activeCaptains.get(captainId);
            
            if (!location) {
                const redisData = await redisClient.get(`captain:${captainId}:location`);
                if (redisData) {
                    location = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                }
            }

            return location;
        } catch (error) {
            console.error('Error getting captain location:', error);
            return null;
        }
    }

    // Start location tracking for a captain
    startTracking(captainId) {
        console.log(`Started tracking for captain ${captainId}`);
        // In a real implementation, you might start a timer or WebSocket connection
    }

    // Stop location tracking for a captain
    stopTracking(captainId) {
        this.activeCaptains.delete(captainId);
        redisClient.del(`captain:${captainId}:location`);
        console.log(`Stopped tracking for captain ${captainId}`);
    }

    // Get all active captains
    getActiveCaptains() {
        return Array.from(this.activeCaptains.entries()).map(([captainId, location]) => ({
            captainId,
            ...location
        }));
    }
}

module.exports = new LocationService(); 