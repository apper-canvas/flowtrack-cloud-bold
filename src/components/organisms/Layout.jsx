import { Outlet } from 'react-router-dom'
import { useAuth } from '@/layouts/Root'
import { useSelector } from 'react-redux'
import Button from '@/components/atoms/Button'
import ApperIcon from '@/components/ApperIcon'

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  )
}

export default Layout