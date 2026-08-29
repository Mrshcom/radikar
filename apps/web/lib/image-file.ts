const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

export async function readProfileImage(file: File) {
  if (!file.type.startsWith("image/"))
    throw new Error("فایل انتخاب‌شده باید تصویر باشد.");
  if (file.size > MAX_PROFILE_IMAGE_SIZE)
    throw new Error("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("خواندن تصویر ناموفق بود."));
    reader.readAsDataURL(file);
  });
}
