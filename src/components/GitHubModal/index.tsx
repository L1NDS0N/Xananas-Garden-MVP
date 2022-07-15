import React, { useState, useEffect } from 'react';
import { X, MapPin, Link as LinkIcon, Buildings, GithubLogo, EnvelopeSimple } from 'phosphor-react';
import AnimatedLogo from '../AnimatedLogo';

interface GitHubProfile {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  html_url: string;
  location: string;
  company: string;
  blog: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    fetch('https://api.github.com/users/l1nds0n')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
        {/* Header gradient */}
        <div className="h-28 bg-gradient-to-br from-[#de818d] via-[#c46878] to-[#a8506a] relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
          {profile && (
            <div className="absolute -bottom-10 left-6">
              <img
                src={profile.avatar_url}
                alt={profile.name || profile.login}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-14 px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <AnimatedLogo size={40} />
              <p className="text-sm text-gray-400">Carregando perfil...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : profile ? (
            <>
              {/* Name & username */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">{profile.name || profile.login}</h2>
                <p className="text-sm text-gray-500">@{profile.login}</p>
                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-5">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{profile.public_repos}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Repos</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{profile.followers}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Seguidores</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{profile.following}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Seguindo</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3 mb-5">
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    {profile.location}
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Buildings size={16} className="text-gray-400 flex-shrink-0" />
                    {profile.company}
                  </div>
                )}
                {profile.blog && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <LinkIcon size={16} className="text-gray-400 flex-shrink-0" />
                    <a
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#de818d] hover:underline truncate"
                    >
                      {profile.blog}
                    </a>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <EnvelopeSimple size={16} className="text-gray-400 flex-shrink-0" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-[#de818d] hover:underline"
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
              </div>

              {/* GitHub link button */}
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gray-900/80 backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/90 text-white font-medium py-3 rounded-xl transition-all"
              >
                <GithubLogo size={18} />
                Ver perfil no GitHub
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GitHubModal;
