import React, { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Loader2, UploadCloud, X, PlusSquare } from "lucide-react";

export default function ReportForm({
  onSubmit,
  isSubmitting,
  title,
  subtitle,
  buttonText,
  fields,
  formError,
  preferCamera = false
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "electronics",
    contact_phone: "",
    [fields.date || "date_found"]: "",
    location: ""
  });
  
  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'id card', label: 'ID Card' },
    { value: 'keys', label: 'Keys' },
    { value: 'water bottle', label: 'Water Bottle' },
    { value: 'bag', label: 'Bag' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'books', label: 'Books' },
    { value: 'stationary', label: 'Stationary' },
    { value: 'jewellery', label: 'Jewellery' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'other', label: 'Other' }
  ];
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };
  
  const handleFileChange = (e) => {
    // More robust file extraction
    let file = null;
    
    if (e.target && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }
    
    console.log("=== FILE UPLOAD DEBUG ===");
    console.log("Event:", e);
    console.log("File object:", file);
    console.log("File name:", file?.name);
    console.log("File type:", file?.type);
    console.log("File size:", file?.size);
    console.log("========================");
    
    if (!file) {
      console.log("No file selected - exiting");
      return;
    }
    
    // Check file size first (before any other validation)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setLocalError("Image too large. Please select a file under 10MB.");
      setImageFile(null);
      setImagePreview(null);
      if (e.target) e.target.value = "";
      return;
    }

    // Clear any previous errors
    setLocalError(null);
    
    // Function to accept and preview the file
    const acceptAndPreview = () => {
      console.log("Starting file preview process...");
      setImageFile(file);
      setImageLoading(true);
      
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        console.log("FileReader started loading...");
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 100);
          console.log(`Loading progress: ${percentLoaded}%`);
        }
      };
      
      reader.onload = (event) => {
        console.log("FileReader completed successfully");
        console.log("Result length:", event.target.result?.length);
        setImagePreview(event.target.result);
        setImageLoading(false);
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        console.error("Error details:", reader.error);
        setLocalError("Failed to load image. Please try again.");
        setImageFile(null);
        setImagePreview(null);
        setImageLoading(false);
      };
      
      reader.onabort = () => {
        console.warn("FileReader aborted");
        setLocalError("Image loading was cancelled.");
        setImageFile(null);
        setImagePreview(null);
        setImageLoading(false);
      };
      
      try {
        console.log("Calling readAsDataURL...");
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Exception calling readAsDataURL:", err);
        setLocalError("Failed to load image. Please try again.");
        setImageFile(null);
        setImagePreview(null);
        setImageLoading(false);
      }
    };

    // Very permissive validation for mobile compatibility
    const fileName = (file.name || "").toLowerCase();
    const mimeType = (file.type || "").toLowerCase();
    
    console.log("Validation check:");
    console.log("- File name:", fileName);
    console.log("- MIME type:", mimeType);
    
    // Check if it's an image by MIME type (most reliable)
    const hasImageMime = mimeType.startsWith("image/");
    
    // Check if it has an image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.svg'];
    const hasImageExt = imageExtensions.some(ext => fileName.endsWith(ext));
    
    console.log("- Has image MIME:", hasImageMime);
    console.log("- Has image extension:", hasImageExt);
    
    // Accept if either MIME type or extension indicates it's an image
    if (hasImageMime || hasImageExt) {
      console.log("✓ File passed validation - accepting");
      acceptAndPreview();
      return;
    }
    
    // Final fallback: if we have a file but no clear indicators (some mobile browsers),
    // try to accept it anyway
    if (file.size > 0) {
      console.log("⚠ No clear image indicators but file exists - accepting anyway (mobile fallback)");
      acceptAndPreview();
      return;
    }
    
    // If we get here, something is wrong
    console.error("✗ File validation failed");
    setLocalError("Please select a valid image file.");
    if (e.target) e.target.value = "";
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
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
            <div className="relative">
              <input
                id="photo-upload"
                type="file"
                name="image"
                ref={fileInputRef}
                onChange={handleFileChange}
                className={!imagePreview ? "absolute inset-0 w-full h-48 opacity-0 cursor-pointer z-10" : "sr-only"}
                accept="image/*"
                multiple={false}
              />
              {imageLoading ? (
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-amrita-blue animate-spin" />
                  <p className="font-semibold text-amrita-blue mt-2">Loading image...</p>
                </div>
              ) : !imagePreview ? (
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 active:bg-gray-100">
                  <UploadCloud className="w-12 h-12 text-gray-400" />
                  <p className="font-semibold text-amrita-blue mt-2">
                    {preferCamera ? "Take photo" : "Upload or take photo"}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, HEIC up to 10MB</p>
                </div>
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
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {imageFile && !imagePreview && (
              <p className="text-xs text-gray-500 mt-2">
                {imageFile.name} · {imageFile.type || "unknown"} · {(imageFile.size/1048576).toFixed(2)}MB
              </p>
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