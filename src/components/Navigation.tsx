import React from 'react';
import { MapPin, Film, Plus, LogIn, LogOut, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavigationProps {
  currentTab: 'places' | 'moments';
  onSelectTab: (tab: 'places' | 'moments') => void;
  onOpenAddMoment: () => void;
  onReliveGlobal: () => void;
  hasMoments: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const TopHeader: React.FC<{
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onReliveGlobal?: () => void;
  onOpenAddMoment?: () => void;
  momentsCount?: number;
}> = ({
  user,
  onLogin,
  onLogout,
  onReliveGlobal,
  onOpenAddMoment,
  momentsCount = 0,
}) => {
  return (
    <header className="w-full bg-[#181411]/90 backdrop-blur-2xl border-b border-[#362b22] sticky top-0 z-40 text-stone-100 transition-all shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo: Momentos - Atlas Personal */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#78350f] text-[#fff8ed] flex items-center justify-center font-editorial font-bold text-base tracking-wider shadow-md shadow-amber-950/40 border border-[#fde68a]/30">
              ✨
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-amber-950 animate-pulse" />
          </div>

          <div>
            <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#fbf6ed] leading-none block">
              Momentos
            </span>
            <span className="font-serif-body text-[11px] sm:text-xs text-amber-200/80 font-normal leading-tight block mt-0.5 tracking-wide italic">
              Marca dónde fuiste. Guarda lo que viviste.
            </span>
          </div>
        </div>

        {/* Action Controls: Revivir & Nuevo Momento */}
        <div className="flex items-center gap-2">
          {/* Botón Mesa de Recuerdos destacado */}
          {momentsCount > 0 && onReliveGlobal && (
            <button
              id="header-btn-relive"
              type="button"
              onClick={onReliveGlobal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#e3a857] via-[#f1c27d] to-[#d69542] text-[#24170c] font-editorial font-bold text-xs shadow-md shadow-amber-950/30 hover:shadow-lg hover:shadow-amber-900/30 transition-all hover:scale-105 active:scale-95 border border-[#ffdfa9]"
              title="Abrir la Mesa de Recuerdos físicos"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#24170c] text-[#24170c]" />
              <span className="tracking-wide">Mesa de Recuerdos</span>
            </button>
          )}

          {/* Botón rápido Añadir Momento */}
          {onOpenAddMoment && (
            <button
              id="header-btn-add-moment"
              type="button"
              onClick={onOpenAddMoment}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a221c] hover:bg-[#342b23] text-stone-200 text-xs font-editorial font-bold border border-[#44362b] transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#e5ba79]" />
              <span>Nuevo Momento</span>
            </button>
          )}

          {/* User Auth */}
          {user ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-[#241d18]/80 border border-[#3e3227] backdrop-blur-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-900/40 text-amber-300 text-xs font-serif font-bold flex items-center justify-center border border-amber-400/30">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-stone-300 hidden sm:inline truncate max-w-[100px]">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-stone-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-login-google"
              type="button"
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a221c] hover:bg-[#342b23] text-[#e8ded3] text-xs font-medium border border-[#4a3c30] transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Conectar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const BottomNavigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddMoment,
  onReliveGlobal,
  hasMoments,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#120d09]/95 backdrop-blur-3xl border-t border-[#2e2218] safe-area-bottom shadow-2xl">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
        {/* 1. 🌍 Mundo (Atlas 3D) */}
        <button
          id="nav-tab-places"
          type="button"
          onClick={() => onSelectTab('places')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'places'
              ? 'text-[#f59e0b] scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <span className="text-xl">🌍</span>
          <span className="text-[11px] font-editorial font-bold tracking-wide">Mundo</span>
        </button>

        {/* 2. ✨ Botón Central: Guardar Momento (< 10 segundos) */}
        <button
          id="nav-btn-quick-moment"
          type="button"
          onClick={onOpenAddMoment}
          className="flex items-center gap-1.5 px-4 py-2 -mt-4 rounded-full bg-gradient-to-tr from-[#b45309] via-[#d97706] to-[#fbbf24] text-[#24170c] font-editorial font-bold text-xs shadow-lg shadow-amber-950/70 hover:scale-105 active:scale-95 transition-all border border-[#fef3c7]"
          title="Guardar un nuevo momento en menos de 10 segundos"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" />
          <span>Momento</span>
        </button>

        {/* 3. 🪐 Mesa de Recuerdos */}
        <button
          id="nav-tab-moments"
          type="button"
          onClick={() => {
            if (hasMoments) {
              onReliveGlobal();
            } else {
              onSelectTab('moments');
            }
          }}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'moments'
              ? 'text-[#f59e0b] scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-[11px] font-editorial font-bold tracking-wide">Mesa</span>
        </button>
      </div>
    </nav>
  );
};
