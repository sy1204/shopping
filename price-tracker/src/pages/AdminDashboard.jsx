
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, Trash2, RefreshCw, UserCheck } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // 권한 체크
    useEffect(() => {
        if (user && user.email !== 'enrichdotcom@naver.com') {
            alert('관리자 권한이 없습니다.');
            navigate('/');
        }
    }, [user, navigate]);

    // 데이터 로드
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;
            const headers = { 'Authorization': `Bearer ${token}` };

            if (activeTab === 'users') {
                // TODO: Backend API for Users
                // 현재 Supabase Admin API 연동이 필요하므로, 백엔드 구현 전에는 빈 배열일 수 있음
                // const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
                // const data = await res.json();
                // setUsers(data); 

                // MOCK DATA for Initial UI Test
                setUsers([
                    { id: '1', email: 'enrichdotcom@naver.com', created_at: '2025-01-01', last_sign_in_at: '2025-12-30' },
                    { id: '2', email: 'test@example.com', created_at: '2025-12-29', last_sign_in_at: '2025-12-29' }
                ]);

            } else {
                const res = await fetch(`${API_BASE_URL}/admin/products`, { headers });
                if (!res.ok) throw new Error('Failed to fetch products');
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error(error);
            setNotification({ message: '데이터 로딩 실패', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, user]);

    const handleDeleteProduct = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Delete failed');

            setProducts(products.filter(p => p.id !== id));
            setNotification({ message: '삭제되었습니다.', type: 'success' });
        } catch (error) {
            setNotification({ message: '삭제 실패', type: 'error' });
        }
    };

    if (!user) return <div style={{ padding: '2rem' }}>로그인이 필요합니다.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>관리자 대시보드</h1>

            {notification && (
                <div style={{ padding: '10px', marginBottom: '1rem', background: notification.type === 'success' ? '#dcfce7' : '#fee2e2', color: notification.type === 'success' ? '#166534' : '#991b1b', borderRadius: '8px' }}>
                    {notification.message}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        flex: 1, padding: '1rem', borderRadius: '12px', border: 'none',
                        background: activeTab === 'users' ? '#3b82f6' : '#f3f4f6',
                        color: activeTab === 'users' ? 'white' : '#666',
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <Users size={20} /> 이용자 관리
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        flex: 1, padding: '1rem', borderRadius: '12px', border: 'none',
                        background: activeTab === 'products' ? '#3b82f6' : '#f3f4f6',
                        color: activeTab === 'products' ? 'white' : '#666',
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <ShoppingBag size={20} /> 상품 목록 관리
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>
                ) : activeTab === 'users' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>가입일</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>최근 접속</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px' }}>{u.email}</td>
                                    <td style={{ padding: '12px' }}>{u.created_at}</td>
                                    <td style={{ padding: '12px' }}>{u.last_sign_in_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', width: '60px' }}>Image</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>상품명</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>등록일</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px' }}>
                                        <img src={p.represent_image} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }} />
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</td>
                                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDeleteProduct(p.id)}
                                            style={{ padding: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
