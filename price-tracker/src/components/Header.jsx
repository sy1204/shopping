
import React from 'react';
import { ShoppingBag, LogIn, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ user, signOut }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navButtonStyle = (active) => ({
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: active ? '#e0f2fe' : 'transparent',
        color: active ? '#0369a1' : '#666',
        fontWeight: active ? 'bold' : 'normal',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
    });

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#111' }}>눈팅 (Noonting)</h1>
                </div>

                {/* Navigation Links */}
                <nav style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={navButtonStyle(isActive('/'))}
                    >
                        구매검토
                    </button>
                    <button
                        onClick={() => navigate('/managed')}
                        style={navButtonStyle(isActive('/managed'))}
                    >
                        물품관리
                    </button>
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user ? (
                    <>
                        <div
                            onClick={() => navigate('/profile')}
                            style={{ fontSize: '14px', color: '#666', marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <span style={{ fontWeight: 'bold' }}>{user.email?.split('@')[0]}</span>님
                        </div>
                        <button
                            onClick={() => signOut()}
                            title="로그아웃"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                        >
                            <LogOut size={20} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <LogIn size={16} /> 로그인
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
