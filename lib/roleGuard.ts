import { Role } from './types'
import { authApi } from './api'

export function getRequiredRole(pathname: string): Role | null {
  if (pathname.startsWith('/dashboard/admin')) {
    return Role.SUPER_ADMIN
  }
  if (pathname.startsWith('/dashboard/dj')) {
    return Role.DJ
  }
  if (pathname.startsWith('/dashboard/user')) {
    return Role.USER
  }
  return null
}

export function shouldRedirect(userRole: Role | null, pathname: string): string | null {
  const requiredRole = getRequiredRole(pathname)
  
  if (!requiredRole) {
    return null
  }

  if (!userRole) {
    return '/login'
  }

  // SUPER_ADMIN can access admin dashboard
  if (requiredRole === Role.SUPER_ADMIN && userRole === Role.SUPER_ADMIN) {
    return null
  }

  // DJ/ARTIST can access DJ dashboard
  if (requiredRole === Role.DJ && (userRole === Role.DJ || userRole === Role.ARTIST)) {
    return null
  }

  // USER can access USER dashboard
  if (requiredRole === Role.USER && userRole === Role.USER) {
    return null
  }

  // Redirect based on role
  if (userRole === Role.SUPER_ADMIN) {
    return '/dashboard/admin'
  }

  if (userRole === Role.DJ || userRole === Role.ARTIST) {
    return '/dashboard/dj'
  }

  if (userRole === Role.USER) {
    return '/dashboard/user'
  }

  return '/login'
}

export function getDashboardPath(role: Role | null): string {
  if (!role) {
    return '/login'
  }

  if (role === Role.SUPER_ADMIN) {
    return '/dashboard/admin'
  }

  if (role === Role.DJ || role === Role.ARTIST) {
    return '/dashboard/dj'
  }

  if (role === Role.USER) {
    return '/dashboard/user'
  }

  return '/login'
}
