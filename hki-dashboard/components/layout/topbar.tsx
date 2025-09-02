'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from '@supabase/supabase-js'

export function Topbar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Intellectual Property Rights Management
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
          Admin Access
        </Badge>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user ? getInitials(user.email || '') : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {user?.email || 'Admin User'}
            </p>
            <p className="text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}