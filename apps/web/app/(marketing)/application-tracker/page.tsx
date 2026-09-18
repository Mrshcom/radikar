import { SeoPage } from "../_components/seo-page";
import { createPageMetadata } from "@/lib/site";

const title = "پیگیری و مدیریت درخواست‌های شغلی";
const description = "فرصت‌های ذخیره‌شده، نسخه رزومه، وضعیت اپلای و مرحله مصاحبه را در یک فضای منظم مدیریت کنید.";
export const metadata = createPageMetadata({ title, description, path: "/application-tracker" });

export default function ApplicationTrackerPage() {
  return <SeoPage path="/application-tracker" eyebrow="مدیریت اپلای" title="همه درخواست‌های شغلی را یک‌جا پیگیری کنید" intro={description} answer="با پیگیری اپلای، هر فرصت به رزومه مربوط به خودش و مرحله فعلی فرایند متصل می‌شود. در نتیجه می‌دانید برای کجا، با کدام نسخه رزومه و در چه تاریخی اقدام کرده‌اید." sections={[
    { heading: "یک جریان منظم از فرصت تا مصاحبه", bullets: ["ثبت و دسته‌بندی فرصت‌های شغلی", "اتصال نسخه رزومه به هر درخواست", "ثبت مرحله فعلی و رویدادهای مهم", "تمرکز روی اقدام بعدی به‌جای پراکندگی اطلاعات"] },
    { heading: "چرا پیگیری اپلای مهم است؟", paragraphs: ["وقتی درخواست‌ها زیاد می‌شوند، جزئیات شرکت، شرح شغل و نسخه ارسالی به‌سادگی گم می‌شوند. ثبت یکپارچه، پیگیری حرفه‌ای‌تر و آمادگی بهتر برای مصاحبه را ممکن می‌کند."] },
  ]} />;
}
