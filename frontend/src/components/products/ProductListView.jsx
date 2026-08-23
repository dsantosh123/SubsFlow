import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CreateProductModal } from './CreateProductModal';
import { 
  Box, 
  Plus, 
  Search, 
  Globe, 
  Key, 
  ArrowRight, 
  ShieldCheck, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export function ProductListView({
  products,
  loading,
  onSelectProduct,
  onCreateProduct,
  currentUserRole = 'OWNER',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">SaaS Products & Integrations</h2>
            <Badge variant="primary" size="sm">PHASE 3</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Register your SaaS applications (e.g. Netflix Streaming, Netflix Games) and generate isolated backend API credentials.
          </p>
        </div>

        {!isDeveloper && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Register Product</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
          <Input
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> registered products
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Box size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No SaaS Products Registered</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Register your first product to generate dedicated client ID and secret credentials for backend API integration.
            </p>
          </div>
          {!isDeveloper && (
            <Button variant="default" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              <span>Register First Product</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="p-6 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => onSelectProduct(product)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-700 flex items-center justify-center transition-colors">
                    <Box size={20} />
                  </div>
                  <Badge variant={product.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                    {product.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                    {product.description || 'No description provided.'}
                  </p>
                </div>

                {product.websiteUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Globe size={13} />
                    <span className="truncate">{product.websiteUrl}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <Calendar size={12} />
                  <span>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Today'}</span>
                </div>

                <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Integration & Keys</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateProduct={onCreateProduct}
      />
    </div>
  );
}
