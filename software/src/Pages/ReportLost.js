import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportForm from "../Components/forms/ReportForm";
import { apiBase } from "../config";

export default function ReportLost() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('date_lost', formData["date_lost"]);
      data.append('contact_phone', formData.contact_phone);
      data.append('location', formData.location);
      if (formData.image) {
        data.append('image', formData.image);
      }

      // Use lost report endpoint
      const response = await fetch(`${apiBase}/api/lost/report`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: data,
      });

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }
      
      if (response.ok) {
        navigate("/dashboard");
      } else {
        const errData = await response.json();
        let errorMessage = errData.message || "An unknown error occurred.";
        if (errData.errors) {
          const errorMessages = Object.values(errData.errors).map(err => err.message).join(", ");
          errorMessage = `Validation Failed: ${errorMessages}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Network error creating lost item:", error);
      setError("A network error occurred. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <ReportForm
      type="lost"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      title="Report a Lost Item"
      subtitle="Report the details of the item you lost. We'll notify you if someone finds it."
      buttonText="Submit Lost Item"
      fields={{
        date: "date_lost",
        dateLabel: "Date item was lost",
        phone: "contact_phone",
        locationLabel: "Last known location"
      }}
      formError={error}
    />
  );
}