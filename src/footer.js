
export default function Footer() {

  return (
    <div className='banner'>
      
      <p>
        <a href="/about" >About</a>
        <a href="/contact">Contact</a>
      </p>

      <div className='icon'>
        <a href="https://github.com/mackthompson16/myMedia" target="_blank">
          <img src="/icons/github-mark.png" alt="GitHub" className='icon' width="30" />
        </a>
      </div>

      
        <p>&copy; 2024 Thompson LLC. All rights reserved.</p>
      
    </div>
  );
}
