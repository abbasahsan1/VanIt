import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-blue-200 flex flex-col items-center justify-center">
      {/* Navbar */}
      <nav className="w-full py-4 bg-blue-500 text-white text-center flex justify-around">
        <Link to="/landing-page" className="hover:underline">Home</Link>
        <Link to="/about" className="hover:underline">About</Link>
        <a href="/contact" className="hover:underline">Contact</a>
      </nav>

      <h1 className="text-4xl font-bold text-blue-700 mb-6">About VANit!</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          VANit! was founded to revolutionize university transportation services by addressing
          the inefficiencies of traditional systems. Our goal is to create a seamless experience for students,
          captains, and administrators by providing real-time tracking, emergency notifications, and
          operational efficiency.
        </p>

        <h2 className="text-2xl font-semibold text-orange-500 mb-4">Why Choose VANit!</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Real-time GPS tracking of university buses.</li>
          <li>Automated notifications for arrivals, delays, and emergencies.</li>
          <li>User-friendly portals for students, captains, and admins.</li>
          <li>Enhanced student safety with SOS and attendance tracking.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-orange-500 mb-4 mt-6">Our Team</h2>
        <p className="text-gray-700 leading-relaxed">
          VANit! is led by a team of innovative students from the Capital University of Science and Technology.
          Our team is committed to improving the everyday commute experience with cutting-edge technology and
          user-centric design.
        </p>
      </div>

      <footer className="mt-8 py-4 bg-blue-500 text-white w-full text-center">
        &copy; 2025 VANit! Transport Hub
      </footer>
    </div>
  );
};

export default AboutPage;
