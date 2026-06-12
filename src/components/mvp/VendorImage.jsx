import React from "react";

const fallbackImages = {
  Katering: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  "Konsumsi Halal": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "Snack Box": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80",
  Perlengkapan: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
  Transportasi: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
  Laundry: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=900&q=80",
  Dokumentasi: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  Manasik: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Al_Qibla.jpg/960px-Al_Qibla.jpg",
};

export default function VendorImage({ src, name, category, className = "h-48" }) {
  const imageSrc = src || fallbackImages[category] || fallbackImages.Katering;

  return (
    <div className={`relative overflow-hidden bg-[#ECFDF5] ${className}`}>
      <img
        src={imageSrc}
        alt={name || "Foto UMKM"}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#064E3B]/36 to-transparent" />
    </div>
  );
}
