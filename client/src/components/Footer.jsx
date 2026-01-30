function Footer() {
  return (
    <footer className="bg-white border-t py-6 text-center text-sm text-gray-500 flex justify-center items-center w-full">
      &copy; {new Date().getFullYear()} CourseSi. All rights reserved.
      <span className="ml-2">| สอบถาม: support.bbp@gmail.com</span>
    </footer>
  );
}
export default Footer;