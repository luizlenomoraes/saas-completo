'use client'

import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './sidebar' // Reutilizando a sidebar no mobile

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#0a0a0a] border-r border-white/10 w-72">
                        <AdminSidebar />
                    </SheetContent>
                </Sheet>

                {/* Breadcrumb ou Título Dinâmico poderia vir aqui */}
                <h2 className="hidden md:block text-sm font-medium text-zinc-400">Painel de Controle</h2>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full relative">
                    <Bell className="w-5 h-5" strokeWidth={1.5} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white/10 hover:ring-[#D4AF37]/50 transition-all">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="/admin-avatar.png" alt="Admin" />
                                <AvatarFallback className="bg-[#D4AF37] text-black font-bold">AD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-white/10 text-white">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Perfil</DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Configurações</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 cursor-pointer">Sair</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
