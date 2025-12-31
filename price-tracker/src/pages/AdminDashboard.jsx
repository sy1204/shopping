
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, Trash2, Edit2, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Filters
    const [productFilter, setProductFilter] = useState('all'); // all, review, managed

    // Modals
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ email: '', password: '' });

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
                const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
                const data = await res.json();
                // If mocked, it returns array. 
                setUsers(Array.isArray(data) ? data : []);
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

    // --- Product Actions ---
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
            setNotification({ message: '상품이 삭제되었습니다.', type: 'success' });
        } catch (error) {
            setNotification({ message: '삭제 실패', type: 'error' });
        }
    };

    const handleUpdateProductCategory = async (id, newCategory) => {
        try {
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: newCategory })
            });

            if (!res.ok) throw new Error('Update failed');

            setProducts(products.map(p => p.id === id ? { ...p, category: newCategory } : p));
            setNotification({ message: '상태가 변경되었습니다.', type: 'success' });
        } catch (error) {
            setNotification({ message: '상태 변경 실패', type: 'error' });
        }
    };

    // --- User Actions ---
    const handleDeleteUser = async (id) => {
        if (!confirm('정말 삭제하시겠습니까? 계정이 영구적으로 삭제됩니다.')) return;
        try {
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Delete failed');
            }

            setUsers(users.filter(u => u.id !== id));
            setNotification({ message: '이용자가 삭제되었습니다.', type: 'success' });
        } catch (error) {
            setNotification({ message: `삭제 실패: ${error.message}`, type: 'error' });
        }
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setEditForm({ email: user.email, password: '' });
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            const updates = {};
            if (editForm.email && editForm.email !== editingUser.email) updates.email = editForm.email;
            if (editForm.password) updates.password = editForm.password;

            if (Object.keys(updates).length === 0) {
                setEditingUser(null);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Update failed');
            }

            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
            setNotification({ message: '정보가 수정되었습니다.', type: 'success' });
            setEditingUser(null);

        } catch (error) {
            setNotification({ message: `수정 실패: ${error.message}`, type: 'error' });
        }
    };

    const filteredProducts = products.filter(p => {
        if (productFilter === 'all') return true;
        // Default null category to 'review' (safer default)
        const cat = p.category || 'review';
        return cat === productFilter;
    });

    if (!user) return <div style={{ padding: '2rem' }}>로그인이 필요합니다.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'Pretendard, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>관리자 대시보드</h1>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold'
                    }}
                >
                    <ShoppingBag size={16} /> 메인으로
                </button>
            </div>

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
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
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
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                >
                    <ShoppingBag size={20} /> 상품 목록 관리
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'visible', minHeight: '400px' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>
                ) : activeTab === 'users' ? (
                    <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>Email</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>가입일</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px' }}>{u.email}</td>
                                        <td style={{ padding: '12px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => openEditUser(u)}
                                                style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Edit2 size={14} /> 수정
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Trash2 size={14} /> 삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {/* Product Filters */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setProductFilter('all')}
                                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: productFilter === 'all' ? '#333' : 'white', color: productFilter === 'all' ? 'white' : '#666', cursor: 'pointer', fontSize: '13px' }}
                            >
                                전체
                            </button>
                            <button
                                onClick={() => setProductFilter('review')}
                                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #fbbf24', background: productFilter === 'review' ? '#fbbf24' : 'white', color: productFilter === 'review' ? 'white' : '#d97706', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <AlertCircle size={12} /> 구매검토
                            </button>
                            <button
                                onClick={() => setProductFilter('managed')}
                                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #10b981', background: productFilter === 'managed' ? '#10b981' : 'white', color: productFilter === 'managed' ? 'white' : '#059669', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <CheckCircle size={12} /> 관리대상
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', width: '60px' }}>Image</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>상품명</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280' }}>상태</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px' }}>
                                            <img src={p.represent_image} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }} />
                                        </td>
                                        <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</td>
                                        <td style={{ padding: '12px' }}>
                                            <select
                                                value={p.category || 'review'}
                                                onChange={(e) => handleUpdateProductCategory(p.id, e.target.value)}
                                                style={{
                                                    padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px',
                                                    background: (p.category || 'review') === 'review' ? '#fffbeb' : '#ecfdf5',
                                                    color: (p.category || 'review') === 'review' ? '#d97706' : '#047857'
                                                }}
                                            >
                                                <option value="review">구매검토</option>
                                                <option value="managed">관리대상</option>
                                            </select>
                                        </td>
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
                    </div>
                )}
            </div>

            {/* User Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>이용자 정보 수정</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#666' }}>이메일</label>
                            <input
                                type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#666' }}>비밀번호 변경 (선택)</label>
                            <input
                                type="password" placeholder="변경시에만 입력" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setEditingUser(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>취소</button>
                            <button onClick={handleUpdateUser} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
