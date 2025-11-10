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
  preferCamera = false
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
    const file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size && file.size > maxSize) {
      setLocalError("Image too large. Please select a file under 10MB.");
      setImageFile(null);
      setImagePreview(null);
      if (e.target) e.target.value = null;
      return;
    }

    const acceptAndPreview = () => {
      setLocalError(null);
      setImageFile(file);
      try {
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      } catch (err) {
        // Fallback to FileReader if URL.createObjectURL fails
        try {
          const reader = new FileReader();
          reader.onload = () => setImagePreview(reader.result);
          reader.onerror = () => {
            setLocalError("Failed to load image preview.");
            setImageFile(null);
            setImagePreview(null);
          };
          reader.readAsDataURL(file);
        } catch (_) {
          setImagePreview(null);
        }
      }
    };

    // Check file extension
    const name = (file.name || "").toLowerCase();
    const hasAllowedExt = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp") || name.endsWith(".heic");
    
    // Check MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/heic", "image/heif"];
    const mimeAllowed = file.type ? allowedTypes.includes(file.type) : false;

    // If either check passes, accept the file
    if (mimeAllowed || hasAllowedExt) {
      acceptAndPreview();
      return;
    }

    // Mobile fallback: check magic bytes for common image formats
    // This handles cases where mobile browsers don't set proper MIME types
    try {
      const blob = file.slice(0, 12);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buf = new Uint8Array(reader.result);
          const isJpeg = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
          const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
          const isWebP = buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
          
          if (isJpeg || isPng || isWebP) {
            acceptAndPreview();
          } else {
            setLocalError("Please select a valid image file (JPG, PNG, or WebP).");
            setImageFile(null);
            setImagePreview(null);
            if (e.target) e.target.value = null;
          }
        } catch (err) {
          // If magic byte check fails, accept anyway (be permissive on mobile)
          console.warn("Magic byte check failed, accepting file anyway:", err);
          acceptAndPreview();
        }
      };
      reader.onerror = () => {
        // If reading fails, accept the file anyway (be permissive)
        console.warn("FileReader error, accepting file anyway");
        acceptAndPreview();
      };
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      // If any error occurs in the fallback, just accept the file (be permissive on mobile)
      console.warn("File validation error, accepting file anyway:", err);
      acceptAndPreview();
    }
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
              onChange={handleFileChange}
              className="sr-only"
              accept="image/*"
              multiple={false}
              capture={preferCamera ? "environment" : undefined}
            />
            {!imagePreview ? (
              <label
                htmlFor="photo-upload"
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
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