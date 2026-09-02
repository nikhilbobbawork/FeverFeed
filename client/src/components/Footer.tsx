export default function Footer() {
  return (
    <footer>
      <div className="flex">
        <div className="w-1/4">Links</div>
        <div className="w-1/4">
          <a href="\">Home</a>
        </div>
        <div className="w-1/4">
          <a href="\about">About</a>
        </div>
        <div className="w-1/4">
          <a href="\contact">Contact</a>
        </div>
      </div>
      <div className="w-full">
        &copy; FeverFeed&trade; By Tigris Technologies
      </div>
    </footer>
  );
}
