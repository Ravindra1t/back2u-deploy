import React, { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Loader2, UploadCloud, X, PlusSquare } from "lucide-react";
// import { format } from "date-fns"; // Not needed for input type="date"

export default function ReportForm({
  onSubmit,
  isSubmitting,
  title,
  subtitle,
  buttonText,
  fields,
  formError,
  preferCamera = false,
  type
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    contact_phone: "",
    [fields.date || "date_found"]: "",
    location: "" // Added location field
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  const isMobileDevice = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    const isMobileUA = /Android|iPhone|iPad|iPod|IEMobile|Windows Phone|BlackBerry|webOS/i.test(ua);
    return isMobileUA || isTouch;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target && e.target.files && e.target.files[0];
    
    if (type === "lost" && isMobileDevice()) {
      alert("uploading lost items image from mobile feature is coming soon on mobile...kindly use desktop in the meanwhile");
      if (e && e.target) e.target.value = null;
      return;
    }
    
    console.log("File selected:", file);
    
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size && file.size > maxSize) {
      setLocalError("Image too large. Please select a file under 10MB.");
      setImageFile(null);
      setImagePreview(null);
      if (e.target) e.target.value = null;
      return;
    }

    const acceptAndPreview = () => {
      console.log("Accepting and previewing file");
      setLocalError(null);
      setImageFile(file);
      setImageLoading(true);
      
      // Always use FileReader for mobile compatibility
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("FileReader loaded successfully");
          setImagePreview(event.target.result);
          setImageLoading(false);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          setLocalError("Failed to load image preview.");
          setImageFile(null);
          setImagePreview(null);
          setImageLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Error creating FileReader:", err);
        setLocalError("Failed to load image preview.");
        setImageFile(null);
        setImagePreview(null);
        setImageLoading(false);
      }
    };

    // For mobile, be very permissive - accept any file that looks like it might be an image
    const name = (file.name || "").toLowerCase();
    const hasImageExt = name.includes(".jpg") || name.includes(".jpeg") || name.includes(".png") || 
                        name.includes(".webp") || name.includes(".heic") || name.includes(".gif") ||
                        name.includes(".bmp");
    
    const mimeType = (file.type || "").toLowerCase();
    const hasImageMime = mimeType.startsWith("image/");

    console.log("File name:", name);
    console.log("File type:", file.type);
    console.log("Has image extension:", hasImageExt);
    console.log("Has image MIME:", hasImageMime);

    // If it has any indication it's an image, accept it immediately
    if (hasImageMime || hasImageExt) {
      console.log("File passed initial checks, accepting");
      acceptAndPreview();
      return;
    }

    // If no extension or MIME type info, still try to accept it (mobile fallback)
    console.log("No clear image indicators, accepting anyway for mobile compatibility");
    acceptAndPreview();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    const dateField = fields.date || "date_found";
    const dateStr = formData[dateField];

    const isValidYMD = (s) => {
      const m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return false;
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      return (
        d.getUTCFullYear() === Number(m[1]) &&
        d.getUTCMonth() + 1 === Number(m[2]) &&
        d.getUTCDate() === Number(m[3])
      );
    };

    if (!isValidYMD(dateStr)) {
      setLocalError("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }

    const completeFormData = {
      ...formData,
      image: imageFile,
    };
    onSubmit(completeFormData);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-gray-200/80">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amrita-blue mb-2">
            {title}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {localError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm font-medium text-red-700">{localError}</p>
            </div>
          )}
          
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm font-medium text-red-700">{formError}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
              Item Name *
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., iPhone 13, Blue backpack"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Color, brand, distinguishing features..."
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue"
              rows={4}
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
              {fields.locationLabel || "Location Found"} (Optional)
            </label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., AB1 Room 302, Central Library"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <Select onValueChange={handleCategoryChange} value={formData.category} required>
                <SelectTrigger className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="id card">ID Card</SelectItem>
                  <SelectItem value="keys">Keys</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="date_found" className="block text-sm font-semibold text-gray-700 mb-1">
                {fields.dateLabel || "Date Found"} *
              </label>
              <Input
                id="date_found"
                name={fields.date || "date_found"}
                type="date"
                value={formData[fields.date || "date_found"]}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact_phone" className="block text-sm font-semibold text-gray-700 mb-1">
              Your Mobile Number (Optional)
            </label>
            <Input
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Photo (Optional)
            </label>
            <input
              id="photo-upload"
              type="file"
              name="image"
              ref={fileInputRef}
              onClick={(e) => {
                if (type === "lost" && isMobileDevice()) {
                  e.preventDefault();
                  alert("uploading lost items image from mobile feature is coming soon on mobile...kindly use desktop in the meanwhile");
                }
              }}
              onChange={handleFileChange}
              className="sr-only"
              accept="image/*"
              multiple={false}
              capture={preferCamera ? "environment" : undefined}
            />
            {imageLoading ? (
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-amrita-blue animate-spin" />
                <p className="font-semibold text-amrita-blue mt-2">Loading image...</p>
              </div>
            ) : !imagePreview ? (
              <label
                htmlFor="photo-upload"
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                onClick={(e) => {
                  if (type === "lost" && isMobileDevice()) {
                    e.preventDefault();
                    alert("uploading lost items image from mobile feature is coming soon on mobile...kindly use desktop in the meanwhile");
                    return;
                  }
                  console.log("Upload area clicked");
                  // Let the default label behavior handle the click
                }}
              >
                <UploadCloud className="w-12 h-12 text-gray-400" />
                <p className="font-semibold text-amrita-blue mt-2">Click to upload</p>
                <p className="text-xs text-gray-500">PNG or JPG up to 10MB</p>
              </label>
            ) : (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    fileInputRef.current.value = null;
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-lg font-semibold bg-amrita-blue text-white rounded-lg hover:bg-amrita-blue-dark transition"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            ) : (
              <PlusSquare className="w-5 h-5 mr-3" />
            )}
            {isSubmitting ? "Submitting..." : buttonText}
          </Button>
        </form>
      </div>
    </div>
  );
}