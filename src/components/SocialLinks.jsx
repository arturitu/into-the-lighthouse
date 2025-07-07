const SocialLinks = ({ className = '' }) => {
  return (
    <div className={'space-x-2 ' + className}>
      <a
        href="mailto:hi@unboring.net"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline"
      >
        email
      </a>
      <span></span>
      <a
        href="https://x.com/arturitu"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline"
      >
        x
      </a>
      <span></span>
      <a
        href="https://linkedin.com/in/arturoparacuellos"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline"
      >
        linkedin
      </a>
      <span></span>
      <a
        href="https://github.com/arturitu"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline"
      >
        github
      </a>
    </div>
  )
}

export default SocialLinks
