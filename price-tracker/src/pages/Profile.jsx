import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { User, Mail, Calendar, Shield, ArrowLeft, LogOut, Key, ShoppingBag, Bell, ChevronRight, CheckCircle } from 'lucide-react';

function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ productsCount: 0 });
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const response = await fetch(`${API_BASE_URL}/products`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats({ productsCount: data.length });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, API_BASE_URL]);

    if (!user) return null;

    const joinedDate = new Date(user.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <button
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem', padding: '8px 0', fontSize: '15px', fontWeight: '500' }}
            >
                <ArrowLeft size={18} /> 대시보드로 돌아가기
            </button>

            <div className="card" style={{ padding: '2.5rem', background: 'white', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent-color)', opacity: 0.05, borderRadius: '50%', zIndex: 0 }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '3rem' }}>
                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--accent-color), #5856d6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'white', boxShadow: '0 10px 20px rgba(0,122,255,0.2)' }}>
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{user.email?.split('@')[0]}님</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>회원 정보 및 계정 설정</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div style={{ padding: '1.5rem', background: '#f8f9fb', borderRadius: '16px', border: '1px solid #f0f0f5' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShoppingBag size={14} /> 관심 상품
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '800' }}>{loading ? '...' : stats.productsCount}개</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#f8f9fb', borderRadius: '16px', border: '1px solid #f0f0f5' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Shield size={14} /> 계정 등급
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-color)' }}>Personal</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0f0f5', borderRadius: '16px', border: '1px solid #f0f0f5', overflow: 'hidden' }}>
                        <div style={{ background: 'white', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Mail size={18} color="#666" />
                                <span style={{ fontSize: '15px', fontWeight: '500' }}>이메일</span>
                            </div>
                            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{user.email}</span>
                        </div>
                        <div style={{ background: 'white', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Calendar size={18} color="#666" />
                                <span style={{ fontSize: '15px', fontWeight: '500' }}>가입일</span>
                            </div>
                            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{joinedDate}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '0.5rem' }}>계정 관리</h3>

                        <button
                            onClick={() => alert('비밀번호 재설정 링크가 이메일로 전송되었습니다. (DEMO)')}
                            style={{ width: '100%', padding: '1rem', background: 'white', border: '1px solid #eee', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fcfcfc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: '#fff9e6', color: '#ffcc00', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Key size={18} />
                                </div>
                                <span style={{ fontWeight: '600', fontSize: '15px' }}>비밀번호 변경</span>
                            </div>
                            <ChevronRight size={18} color="#ccc" />
                        </button>

                        <button
                            onClick={signOut}
                            style={{ width: '100%', padding: '1rem', background: 'white', border: '1px solid #ffebeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: '#fff0f0', color: 'var(--danger-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LogOut size={18} />
                                </div>
                                <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--danger-color)' }}>로그아웃</span>
                            </div>
                            <ChevronRight size={18} color="#ccc" />
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    AllTimePrice v1.0.0 &copy; 2024 All Rights Reserved.
                </p>
            </div>
        </div>
    );
}

export default Profile;
