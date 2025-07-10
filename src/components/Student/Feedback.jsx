import React, { useState } from "react";
import axios from "axios";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("studentEmail");

    try {
      await axios.post("http://localhost:5000/api/student/feedback", {

        email,
        message,
      });
      setSuccess(true);
      setMessage("");
    } catch (error) {
      alert("❌ Failed to send feedback");
      console.error(error);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Feedback Form</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md p-6 rounded-lg">
        <textarea
          className="w-full border p-4 rounded mb-4"
          placeholder="Write your feedback here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Feedback
        </button>
        {success && <p className="text-green-600 mt-4">Feedback sent successfully!</p>}
      </form>
    </div>
  );
};

export default Feedback;
