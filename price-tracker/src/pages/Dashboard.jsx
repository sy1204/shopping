
import { useState, useEffect } from 'react'
import { Plus, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductDetail from '../components/ProductDetail';

function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [urlInput, setUrlInput] = useState("");
    const [notification, setNotification] = useState(null);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const API_BASE_URL = 'http://localhost:3001/api';

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);

            // Filter for 'review' category (default if null)
            const reviewProducts = data.filter(p => (p.category || 'review') === 'review');

            if (reviewProducts.length > 0 && !selectedProduct) {
                setSelectedProduct(reviewProducts[0]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setNotification({ message: '상품 목록을 불러오는 데 실패했습니다.', type: 'error' });
        }
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        fetchProducts();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    const addNewProductByUrl = async () => {
        if (!user) {
            setNotification({ message: '상품 등록은 로그인이 필요합니다.', type: 'error' });
            setTimeout(() => navigate('/login'), 1500);
            return;
        }
        const url = urlInput.trim();
        if (!url) return;
        if (!url.startsWith('http')) {
            setNotification({ message: '올바른 URL을 입력해주세요 (http://...)', type: 'error' });
            return;
        }

        setNotification({ message: '상품 정보를 가져오는 중입니다...', type: 'info' });
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (!response.ok) throw new Error('Failed to register product');
            await response.json();
            setNotification({ message: '상품이 성공적으로 등록되었습니다!', type: 'success' });
            setUrlInput("");
            await fetchProducts();
        } catch (error) {
            console.error("Registration error:", error);
            setNotification({ message: '상품 등록에 실패했습니다.', type: 'error' });
        }
    };

    const removeProduct = async (id, e) => {
        e.stopPropagation();
        if (!user) return;
        // In a real app we would call DELETE API
        const filtered = products.filter(p => p.id !== id);
        setProducts(filtered);
        if (selectedProduct?.id === id) {
            setSelectedProduct(null);
        }
    };

    const updateMemo = (productId, newMemo) => {
        const updated = products.map(p =>
            p.id === productId ? { ...p, memo: newMemo } : p
        );
        setProducts(updated);
        // Note: Ideally we should persist this to backend
    };

    const adjustTargetPrice = (delta) => {
        if (!selectedProduct) return;
        const currentTarget = selectedProduct.targetPrice || 0;
        const newPrice = Math.max(0, currentTarget + delta);
        const updated = products.map(p =>
            p.id === selectedProduct.id ? { ...p, targetPrice: newPrice } : p
        );
        setProducts(updated);
        setSelectedProduct({ ...selectedProduct, targetPrice: newPrice });
    };

    const toggleAlertOption = (option) => {
        if (!selectedProduct) return;
        const currentOptions = selectedProduct.alertOptions || { priceDrop: true, targetHit: true };
        const newOptions = { ...currentOptions, [option]: !currentOptions[option] };
        const updated = products.map(p =>
            p.id === selectedProduct.id ? { ...p, alertOptions: newOptions } : p
        );
        setProducts(updated);
        setSelectedProduct({ ...selectedProduct, alertOptions: newOptions });
    };

    const updateProductCategory = async (productId, newCategory) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: newCategory })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || 'Failed to update category');
            }

            const updated = products.map(p =>
                p.id === productId ? { ...p, category: newCategory } : p
            );

            // If moved to 'managed', remove from current view if it's 'review' only
            // But doing it via state update is safer
            setProducts(updated);

            if (newCategory === 'managed') {
                setNotification({ message: '물품관리로 이동되었습니다. (페이지 이동)', type: 'success' });
                // Navigate to managed page after a short delay to let user see the message
                setTimeout(() => {
                    navigate('/managed');
                }, 1000);
            }

            // Sync with backend fully
            fetchProducts();

        } catch (error) {
            console.error(error);
            setNotification({ message: `상태 변경 실패: ${error.message}`, type: 'error' });
        }
    };

    // Helper for List Item
    const getPrimaryMallData = (product) => {
        if (!product || !product.malls || product.malls.length === 0) return null;
        return product.malls.reduce((prev, curr) => curr.price < prev.price ? curr : prev);
    };

    const reviewProducts = products.filter(p => (p.category || 'review') === 'review');

    return (
        <div className="container" style={{
            maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column',
            height: '100vh', padding: isMobile ? '0.5rem' : '1.5rem', boxSizing: 'border-box', overflow: 'hidden',
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
        }}>
            <Header user={user} signOut={signOut} />

            {notification && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: notification.type === 'success' ? '#10b981' : (notification.type === 'error' ? '#ef4444' : '#3b82f6'),
                    color: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 9999, fontSize: '14px', fontWeight: 'bold', animation: 'fadeInOut 3s forwards'
                }}>
                    {notification.message}
                </div>
            )}

            <div style={{
                display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '2rem',
                flex: 1, minHeight: 0, height: '100%'
            }}>
                {/* LEFT: Product List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#444' }}>새 상품 등록</div>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <input
                                placeholder={user ? "상품 URL을 입력하세요" : "로그인이 필요합니다"}
                                value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNewProductByUrl()}
                                disabled={!user}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', background: user ? '#f9fafb' : '#eee' }}
                            />
                            <button onClick={addNewProductByUrl} disabled={!user} style={{ padding: '0 12px', background: user ? '#3b82f6' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: user ? 'pointer' : 'default' }}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            window.postMessage({ type: 'TRIGGER_SYNC' }, '*');
                            setNotification({ message: '가격 동기화를 시작합니다. (새 탭이 열렸다가 닫힙니다)', type: 'info' });
                        }}
                        style={{
                            width: '100%', padding: '10px', background: 'white', border: '1px solid #ddd', borderRadius: '12px',
                            color: '#555', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            marginBottom: '10px'
                        }}
                    >
                        <RefreshCw size={16} /> 전체 가격 업데이트
                    </button>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px', paddingLeft: '4px' }}>
                            구매검토 ({reviewProducts.length})
                        </div>
                        {reviewProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#ccc', fontSize: '14px' }}>등록된 상품이 없습니다.</div>
                        ) : (
                            reviewProducts.map(product => {
                                const isSelected = selectedProduct?.id === product.id;
                                const pData = getPrimaryMallData(product);
                                return (
                                    <div key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        style={{
                                            display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px',
                                            background: isSelected ? '#edf7ff' : 'white',
                                            border: isSelected ? '1px solid #3b82f6' : '1px solid #f0f0f0',
                                            cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center'
                                        }}
                                    >
                                        <img src={product.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', background: 'white' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{pData?.price.toLocaleString() || 0}원</div>
                                        </div>
                                        {user && (
                                            <button onClick={(e) => removeProduct(product.id, e)} style={{ color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail View */}
                <div style={{
                    background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', border: '1px solid #f0f0f0'
                }}>
                    <ProductDetail
                        selectedProduct={selectedProduct}
                        user={user}
                        onUpdateMemo={updateMemo}
                        onAdjustTargetPrice={adjustTargetPrice}
                        onToggleAlertOption={toggleAlertOption}
                        onUpdateCategory={updateProductCategory}
                    />
                </div>
            </div>
        </div>
    )
}

export default Dashboard;

