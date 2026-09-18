import { SeoPage } from "../_components/seo-page";
import { createPageMetadata } from "@/lib/site";
const title = "ارتباط با رادیکار";
const description = "راه ارتباط با پشتیبانی رادیکار برای پرسش‌های حساب، رزومه، پرداخت و بازخورد محصول.";
export const metadata = createPageMetadata({ title, description, path: "/contact" });
export default function ContactPage() { return <SeoPage path="/contact" eyebrow="ارتباط با ما" title="چطور با پشتیبانی رادیکار ارتباط بگیریم؟" intro={description} answer="در نسخه فعلی، درخواست پشتیبانی را از داخل حساب کاربری و همراه با موضوع و توضیح دقیق ثبت کنید. اطلاعات تماس عمومی پس از نهایی‌شدن کانال رسمی در همین صفحه منتشر می‌شود." sections={[{ heading: "برای پاسخ سریع‌تر چه اطلاعاتی بفرستیم؟", bullets: ["موضوع درخواست و مرحله‌ای که در آن هستید", "شرح دقیق رفتار مشاهده‌شده و نتیجه مورد انتظار", "زمان تقریبی رخداد؛ بدون ارسال رمز یا کد یک‌بارمصرف", "در مشکلات پرداخت، شناسه سفارش بدون اطلاعات محرمانه بانکی"] }, { heading: "اطلاعات محرمانه را ارسال نکنید", paragraphs: ["پشتیبانی هرگز رمز، کد یک‌بارمصرف یا اطلاعات کامل کارت بانکی را درخواست نمی‌کند."] }]} cta="ورود به حساب" />; }
