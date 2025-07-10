// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { FaTrash, FaHome, FaPlus, FaEdit, FaUserCircle } from "react-icons/fa";

// const DeleteRoute = () => {
//   const [routes, setRoutes] = useState([]); 
//   const navigate = useNavigate();

//   // ✅ Fetch Routes - Handle API Response Properly
//   useEffect(() => {
//     const fetchRoutes = async () => {
//       try {
//         const response = await axios.get("http://localhost:5000/api/routes");
//         console.log("Routes API Response:", response.data);

//         // ✅ Ensure API returns an array
//         if (Array.isArray(response.data)) {
//           setRoutes(response.data);
//         } else {
//           console.error("Unexpected API response format:", response.data);
//           setRoutes([]);
//         }
//       } catch (error) {
//         console.error("Error fetching routes:", error);
//         setRoutes([]);
//       }
//     };

//     fetchRoutes();
//   }, []);

//   // ✅ Handle Route Deletion
//   const handleDelete = async (route_id) => {
//     if (!window.confirm("Are you sure you want to delete this route?")) return;

//     try {
//       await axios.delete(`http://localhost:5000/api/routes/${route_id}`);
//       setRoutes(routes.filter(route => route.route_id !== route_id)); 
//       alert("Route deleted successfully!");
//     } catch (error) {
//       console.error("Error deleting route:", error);
//       alert("Failed to delete route!");
//     }
//   };

//   // ✅ Logout Function
//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     navigate("/");
//   };

//   return (
//     <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
//       {/* ✅ Navigation Bar */}
//       <nav className="bg-white p-4 shadow-md flex justify-between items-center">
//         <div className="flex items-center">
//           <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-3" />
//           <h1 className="text-orange-600 font-bold text-lg">
//             Capital University of Science and Technology
//           </h1>
//         </div>
//         <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
//           <Link to="/dashboard" className="hover:text-blue-800 flex items-center">
//             <FaHome className="mr-1" /> Home
//           </Link>
//           <Link to="/routes" className="hover:text-blue-800 flex items-center">
//             <FaPlus className="mr-1" /> Routes
//           </Link>
//           <Link to="/add-route" className="hover:text-blue-800 flex items-center">
//             <FaPlus className="mr-1" /> Add Route
//           </Link>
//           <Link to="/edit-route" className="hover:text-blue-800 flex items-center">
//             <FaEdit className="mr-1" /> Edit Route
//           </Link>
//           <button onClick={handleLogout} className="hover:text-blue-800">Logout</button>
//         </div>
//         <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
//           <FaUserCircle className="text-gray-600 text-2xl" />
//         </div>
//       </nav>

//       {/* ✅ Routes List with Delete Option */}
//       <div className="p-10">
//         <div className="bg-white shadow-lg rounded-lg p-6">
//           <h1 className="text-2xl font-bold text-red-600 mb-4">Delete Routes</h1>

//           {routes.length === 0 ? (
//             <p className="text-gray-500">No routes available to delete.</p>
//           ) : (
//             <ul className="space-y-4">
//               {routes.map((route) => (
//                 <li
//                   key={route.route_id}
//                   className="p-4 bg-[#7DB4E6] shadow-md rounded-lg flex justify-between items-center"
//                 >
//                   <div>
//                     <h2 className="text-lg font-semibold text-white">{route.route_name}</h2>
//                     <p className="text-gray-100">Stops: {route.stops.map(stop => stop.stop_name).join(", ") || "No stops added"}</p>
//                   </div>
//                   <button
//                     onClick={() => handleDelete(route.route_id)}
//                     className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
//                   >
//                     <FaTrash className="mr-2" /> Delete
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeleteRoute;

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaHome, FaPlus, FaEdit, FaUserCircle } from "react-icons/fa";

const DeleteRoute = () => {
  const [routes, setRoutes] = useState([]); 
  const navigate = useNavigate();

  // ✅ Fetch Routes and Transform API Response
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/routes");
        console.log("✅ Routes API Response:", response.data);

        if (response.data && typeof response.data === "object") {
          // 🔥 Convert Object into an Array for Mapping
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || []  // Ensure stops is always an array
          }));
          setRoutes(formattedRoutes);
        } else {
          console.error("❌ Unexpected API response format:", response.data);
          setRoutes([]);
        }
      } catch (error) {
        console.error("❌ Error fetching routes:", error);
        setRoutes([]);
      }
    };

    fetchRoutes();
  }, []);

  // ✅ Handle Route Deletion
  const handleDelete = async (route_name) => {
    if (!window.confirm(`Are you sure you want to delete ${route_name}?`)) return;

    try {
        await axios.delete(`http://localhost:5000/api/routes/${encodeURIComponent(route_name)}`);
        setRoutes(routes.filter(route => route.route_name !== route_name));
        alert(`✅ ${route_name} deleted successfully!`);
    } catch (error) {
        console.error("❌ Error deleting route:", error);
        alert("Failed to delete route!");
    }
};


  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/1.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">Capital University of Science and Technology</h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center"><FaHome className="mr-1" /> Home</Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center"><FaPlus className="mr-1" /> Routes</Link>
          <Link to="/add-route" className="hover:text-blue-800 flex items-center"><FaPlus className="mr-1" /> Add Route</Link>
          <Link to="/edit-route" className="hover:text-blue-800 flex items-center"><FaEdit className="mr-1" /> Edit Route</Link>
          <button className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* ✅ Routes List with Delete Option */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Delete Routes</h1>

          {routes.length === 0 ? (
            <p className="text-gray-500">No routes available to delete.</p>
          ) : (
            <ul className="space-y-4">
              {routes.map((route, index) => (
                <li key={index} className="p-4 bg-[#7DB4E6] shadow-md rounded-lg flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{route.route_name}</h2>
                    <p className="text-gray-100">
                      Stops: {route.stops.length > 0 ? route.stops.map(stop => stop.stop_name).join(", ") : "No stops added"}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(route.route_name)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center">
                    <FaTrash className="mr-2" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteRoute;
