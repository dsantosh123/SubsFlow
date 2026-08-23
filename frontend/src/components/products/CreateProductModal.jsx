import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Box, Globe, FileText } from 'lucide-react';

export function CreateProductModal({
  isOpen,
  onClose,
  onCreateProduct,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateProduct({
        name: name.trim(),
        description: description.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
      });
      setName('');
      setDescription('');
      setWebsiteUrl('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Register SaaS Product"
      description="Register your SaaS application or service with SubsFlow to generate isolated API credentials."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Name</label>
          <Input
            placeholder="e.g. Netflix Streaming"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<Box size={15} />}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Description (Optional)</label>
          <Input
            placeholder="e.g. Video streaming and content delivery platform"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<FileText size={15} />}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Website / App URL (Optional)</label>
          <Input
            type="url"
            placeholder="https://netflix.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            icon={<Globe size={15} />}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" loading={loading} disabled={!name.trim()}>
            Register Product
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
