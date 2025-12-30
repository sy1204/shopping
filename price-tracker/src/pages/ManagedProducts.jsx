
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductDetail from '../components/ProductDetail';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const ManagedProducts = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = 'http://localhost:3001/api';

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();

            // Filter for 'managed' category
            const managed = data.filter(p => p.category === 'managed');
            setProducts(managed);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // NOTE: Functions below are duplicated from Dashboard logic. 
    // In a production app, we should move these to a Context or Custom Hook (useProducts).
    const updateMemo = (productId, newMemo) => {
        const updated = products.map(p => p.id === productId ? { ...p, memo: newMemo } : p);
        setProducts(updated);
        // Sync with API would happen here
    };

    const adjustTargetPrice = (delta) => {
        if (!selectedProduct) return;
        const currentTarget = selectedProduct.targetPrice || 0;
        const newPrice = Math.max(0, currentTarget + delta);
        const updated = products.map(p => p.id === selectedProduct.id ? { ...p, targetPrice: newPrice } : p);
        setProducts(updated);
        setSelectedProduct({ ...selectedProduct, targetPrice: newPrice });
    };

    const toggleAlertOption = (option) => {
        if (!selectedProduct) return;
        const currentOptions = selectedProduct.alertOptions || { priceDrop: true, targetHit: true };
        const newOptions = { ...currentOptions, [option]: !currentOptions[option] };
        const updated = products.map(p => p.id === selectedProduct.id ? { ...p, alertOptions: newOptions } : p);
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

            if (!response.ok) throw new Error('Failed to update category');

            // Optimistic Update
            const updated = products.map(p =>
                p.id === productId ? { ...p, category: newCategory } : p
            );

            setProducts(updated);

            if (newCategory === 'review') {
                // Navigate back to Main Dashboard
                setTimeout(() => {
                    navigate('/'); // Assuming navigate is available
                }, 500);
            } else {
                // Just refresh
                fetchProducts();
            }

        } catch (error) {
            console.error(error);
            alert('상태 변경 실패');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', fontFamily: 'Pretendard, sans-serif' }}>
            <Header user={user} signOut={signOut} />

            <h2 style={{ marginBottom: '1.5rem' }}>물품 관리 (Gallery)</h2>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {products.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                            관리 대상 상품이 없습니다.
                        </div>
                    ) : (
                        products.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProduct(p)}
                                style={{
                                    border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden',
                                    cursor: 'pointer', transition: 'transform 0.2s', background: 'white',
                                    display: 'flex', flexDirection: 'column'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <div style={{ width: '100%', height: '180px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={p.image} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                    <div style={{ fontSize: '13px', color: '#666' }}>
                                        {p.malls?.[0]?.price.toLocaleString()}원
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal for Details */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh',
                        borderRadius: '24px', overflowY: 'auto', padding: '2rem', position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                        >
                            <X size={24} />
                        </button>

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
            )}
        </div>
    );
};

export default ManagedProducts;
