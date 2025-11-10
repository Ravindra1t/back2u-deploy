import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportForm from "../Components/forms/ReportForm";
import { apiBase } from "../config";

export default function ReportFound() {
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
      data.append('date_found', formData["date_found"]);
      data.append('contact_phone', formData.contact_phone);
      data.append('location', formData.location);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await fetch(`${apiBase}/api/items/report`, {
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
      console.error("Network error creating found item:", error);
      setError("A network error occurred. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <ReportForm
      type="found"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      title="Report a Found Item"
      subtitle="Thank you for helping our campus community."
      buttonText="Submit Found Item"
      fields={{
        date: "date_found",
        dateLabel: "Date item was found",
        phone: "contact_phone",
        locationLabel: "Location Found"
      }}
      formError={error}
    />
  );
}