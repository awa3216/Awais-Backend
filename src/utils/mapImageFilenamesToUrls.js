export default function mapImageFilenamesToUrls(yacht, req) {
  const mapFields = (item) => ({
    ...item,
    primaryImage: item.primaryImage || null,
    galleryImages: (item.galleryImages || []),
  });
  if (Array.isArray(yacht)) {
    return yacht.map(mapFields);
  } else {
    return mapFields(yacht);
  }
}