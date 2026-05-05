import { Link } from 'react-router-dom'

const FullLogo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="text-xl font-bold text-primary">SIVWEB</span>
    </Link>
  )
}

export default FullLogo