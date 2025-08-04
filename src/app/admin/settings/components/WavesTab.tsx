'use client';

import React, { useState, useEffect } from 'react';
import { WaveService, Wave, CreateWaveData } from '@/services/waveService';
import Button from '@/components/Button';

interface WaveWithStats extends Wave {
  total_users: number;
  active_users: number;
  pending_users: number;
}

export default function WavesTab() {
  const [waves, setWaves] = useState<WaveWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWave, setEditingWave] = useState<Wave | null>(null);
  const [formData, setFormData] = useState<CreateWaveData>({
    name: '',
    description: '',
    start_position: 1,
    end_position: 100,
  });

  useEffect(() => {
    loadWaves();
  }, []);

  const loadWaves = async () => {
    try {
      const wavesData = await WaveService.getAllWavesWithStats();
      setWaves(wavesData);
    } catch (error) {
      console.error('Error loading waves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating wave:', formData);
      const result = await WaveService.createWave(formData);
      console.log('Create result:', result);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', start_position: 1, end_position: 100 });
      await loadWaves();
    } catch (error) {
      console.error('Error creating wave:', error);
      alert('Error creating wave: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWave) return;

    // Double check if wave is active (in case of race conditions)
    const currentWave = waves.find(w => w.id === editingWave.id);
    if (currentWave?.is_active) {
      alert('Cannot edit an active wave. Please deactivate the wave first.');
      return;
    }
    
    try {
      console.log('Updating wave:', editingWave.id, formData);
      const result = await WaveService.updateWave(editingWave.id, formData);
      console.log('Update result:', result);
      if (result) {
        setEditingWave(null);
        setFormData({ name: '', description: '', start_position: 1, end_position: 100 });
        await loadWaves();
      } else {
        alert('Failed to update wave. Check console for details.');
      }
    } catch (error) {
      console.error('Error updating wave:', error);
      alert('Error updating wave: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteWave = async (waveId: string) => {
    if (!confirm('Are you sure you want to delete this wave? This will remove all users from this wave.')) return;
    
    try {
      console.log('Deleting wave:', waveId);
      const result = await WaveService.deleteWave(waveId);
      console.log('Delete result:', result);
      if (result) {
        await loadWaves();
      } else {
        alert('Failed to delete wave. The wave may have users assigned to it. Please remove users from the wave first or deactivate it instead.');
      }
    } catch (error) {
      console.error('Error deleting wave:', error);
      alert('Error deleting wave: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleActivateWave = async (waveId: string) => {
    try {
      console.log('Activating wave:', waveId);
      const result = await WaveService.activateWave(waveId);
      console.log('Activation result:', result);
      if (result) {
        await loadWaves();
      } else {
        alert('Failed to activate wave. Check console for details.');
      }
    } catch (error) {
      console.error('Error activating wave:', error);
      alert('Error activating wave: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeactivateWave = async (waveId: string) => {
    try {
      console.log('Deactivating wave:', waveId);
      const result = await WaveService.deactivateWave(waveId);
      console.log('Deactivation result:', result);
      if (result) {
        await loadWaves();
      } else {
        alert('Failed to deactivate wave. Check console for details.');
      }
    } catch (error) {
      console.error('Error deactivating wave:', error);
      alert('Error deactivating wave: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openEditModal = (wave: Wave) => {
    if (wave.is_active) {
      alert('Cannot edit an active wave. Please deactivate the wave first.');
      return;
    }
    setEditingWave(wave);
    setFormData({
      name: wave.name,
      description: wave.description || '',
      start_position: wave.start_position,
      end_position: wave.end_position,
    });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingWave(null);
    setFormData({ name: '', description: '', start_position: 1, end_position: 100 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Wave Management</h2>
          <p className="text-sm text-gray-500">
            Create and manage access waves for your waitlist
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Wave
        </Button>
      </div>

      {/* Waves Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waves.map((wave) => (
                <tr key={wave.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {wave.name}
                      </div>
                      {wave.description && (
                        <div className="text-sm text-gray-500">
                          {wave.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {wave.start_position} - {wave.end_position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Total: {wave.total_users}</div>
                      <div className="text-green-600">Active: {wave.active_users}</div>
                      <div className="text-yellow-600">Pending: {wave.pending_users}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      wave.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {wave.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {wave.activated_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Activated: {new Date(wave.activated_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(wave)}
                      disabled={wave.is_active}
                      className={`${wave.is_active ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={wave.is_active ? 'Deactivate wave to edit' : 'Edit wave'}
                    >
                      Edit
                    </Button>
                    {wave.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateWave(wave.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateWave(wave.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWave(wave.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWave) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingWave ? 'Edit Wave' : 'Create New Wave'}
              </h3>
              <form onSubmit={editingWave ? handleUpdateWave : handleCreateWave}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Position
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.start_position}
                        onChange={(e) => setFormData({ ...formData, start_position: parseInt(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Position
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.end_position}
                        onChange={(e) => setFormData({ ...formData, end_position: parseInt(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModals}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {editingWave ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 