import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChatCircle, X, PaperPlaneTilt, ShoppingCart, Sparkle, Package } from 'phosphor-react';
import Cookies from 'js-cookie';
import { openWhatsApp } from '../../lib/settings';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useSWRProducts';
import { useCategories } from '../../hooks/useSWRCategories';
import { useCart } from '../../context/CartContext';
import { api } from '../../lib/api';
import {
  ChatCampaign, ChatProduct, detectIntent, featuredProducts, findCategoryMatch,
  priceForProduct, searchProducts,
} from '../../lib/chatbotEngine';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  options?: string[];
  products?: ChatProduct[];
}

const QUICK_MESSAGES = [
  'Produtos em destaque',
  'Promoções ativas',
  'Quais categorias vocês têm?',
  'Falar com vendedor',
];

// Sound effects
const playSound = (type: 'message' | 'open' | 'close' | 'send') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'message':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'open':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'close':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'send':
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
        break;
    }
  } catch (e) {
    // Silently fail if audio is not available
  }
};

const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const [campaigns, setCampaigns] = useState<ChatCampaign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewedProducts, setViewedProducts] = useState<string[]>([]);

  useEffect(() => {
    api.get('/campaigns?public=true').then(r => {
      if (Array.isArray(r.data)) setCampaigns(r.data);
    }).catch(() => {});
  }, []);

  // Track viewed products via cookies
  useEffect(() => {
    const tracked = Cookies.get('viewed_products');
    if (tracked) {
      try {
        setViewedProducts(JSON.parse(tracked));
      } catch {}
    }
  }, []);

  const trackProduct = (productName: string) => {
    setViewedProducts(prev => {
      const updated = Array.from(new Set(prev.concat(productName))).slice(-10);
      Cookies.set('viewed_products', JSON.stringify(updated), { expires: 30 });
      return updated;
    });
  };

  const topCategories = useMemo(() => categories.slice(0, 3).map(c => `Ver ${c.name}`), [categories]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const personalizedGreeting = viewedProducts.length > 0
        ? `Olá! Vi que você ficou interessado em ${viewedProducts[viewedProducts.length - 1]}! `
        : 'Olá! Bem-vindo(a) à ';

      const welcomeMsg: Message = {
        id: 1,
        text: personalizedGreeting + (viewedProducts.length > 0
          ? 'Posso te ajudar com mais informações? 🌸'
          : 'Xananas\' Garden! 🌺 Sou o assistente virtual e conheço todo o catálogo — me diga o que procura!'),
        sender: 'bot',
        timestamp: new Date(),
        options: QUICK_MESSAGES.slice(0, 3),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, viewedProducts]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleOpen = () => {
    playSound('open');
    setIsOpen(true);
  };

  const handleClose = () => {
    playSound('close');
    setIsOpen(false);
  };

  const productToOption = (p: ChatProduct) => `Sobre ${p.name}`;

  const buildReply = (userMessage: string): { text: string; options?: string[]; products?: ChatProduct[] } => {
    const intent = detectIntent(userMessage);
    const availableProducts = products as unknown as ChatProduct[];

    switch (intent) {
      case 'greeting':
        return {
          text: 'Oi! 🌸 Em que posso ajudar? Posso buscar produtos, checar preço, estoque e promoções em tempo real.',
          options: QUICK_MESSAGES.slice(0, 3),
        };

      case 'thanks':
        return { text: 'Por nada! Se precisar de mais alguma coisa, é só chamar. 🌱', options: ['Ver produtos em destaque', 'Falar com vendedor'] };

      case 'seller':
        return { text: 'Vou te redirecionar para o nosso WhatsApp! Lá você tira todas as suas dúvidas com um atendente de verdade. 📱' };

      case 'shipping':
        return {
          text: 'A forma e o prazo de entrega variam por região. Fala com a gente no WhatsApp que a gente confirma certinho pra você! 🚚',
          options: ['Falar com vendedor', 'Voltar ao catálogo'],
        };

      case 'promotions': {
        const active = campaigns.filter(c => c.discountValue > 0 || c.products.length > 0);
        if (active.length === 0) {
          return {
            text: 'No momento não temos nenhuma campanha ativa, mas fica de olho — sempre tem novidade por aqui! 🌷',
            options: ['Produtos em destaque', 'Voltar ao catálogo'],
          };
        }
        const lines = active.map(c => {
          const off = c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${formatBRL(c.discountValue)} OFF`;
          return `🔥 ${c.name} — ${off}`;
        });
        return {
          text: `Temos campanhas ativas agora:\n${lines.join('\n')}`,
          options: active.filter(c => c.slug).map(c => `Ver campanha ${c.name}`).slice(0, 3),
        };
      }

      case 'stock': {
        const matches = searchProducts(availableProducts, userMessage, 3);
        if (matches.length === 0) {
          return { text: 'Não encontrei esse produto no catálogo. Pode me dizer o nome de outra forma?', options: ['Quais categorias vocês têm?'] };
        }
        const lines = matches.map(p => `${p.amount > 0 ? '✅' : '❌'} ${p.name} — ${p.amount > 0 ? `${p.amount} em estoque` : 'sem estoque no momento'}`);
        return { text: lines.join('\n'), products: matches };
      }

      case 'price': {
        const matches = searchProducts(availableProducts, userMessage, 3);
        if (matches.length === 0) {
          return { text: 'Não encontrei esse produto. Me conta o nome ou a categoria que você procura? 🌸', options: topCategories };
        }
        const lines = matches.map(p => {
          const priced = priceForProduct(p, campaigns);
          if (priced.isPromo) return `${p.name}: de ${formatBRL(priced.original)} por ${formatBRL(priced.price)} 🔥 (${priced.campaignName})`;
          return `${p.name}: ${formatBRL(priced.price)}`;
        });
        return { text: lines.join('\n'), products: matches };
      }

      case 'categories': {
        if (categories.length === 0) return { text: 'Ainda estou carregando nosso catálogo, tenta de novo em instantes! 🌱' };
        return {
          text: `Temos estas categorias no catálogo:\n${categories.map(c => `• ${c.name}`).join('\n')}`,
          options: categories.slice(0, 4).map(c => `Ver ${c.name}`),
        };
      }

      case 'featured': {
        const rec = featuredProducts(availableProducts, viewedProducts, 4);
        if (rec.length === 0) return { text: 'Ainda não temos produtos disponíveis para mostrar, volta em breve! 🌱' };
        return { text: 'Estes são os produtos que separei pra você: 🌺', products: rec };
      }

      case 'search':
      default: {
        // Try a category match first ("Ver Suculentas" style, or a bare category name)
        const cat = findCategoryMatch(categories, userMessage);
        const matches = searchProducts(availableProducts, userMessage, 4);

        if (matches.length > 0) {
          trackProduct(matches[0].name);
          return {
            text: `Encontrei ${matches.length > 1 ? 'estes produtos' : 'este produto'} pra você: 🌸`,
            products: matches,
            options: matches.slice(0, 2).map(productToOption),
          };
        }

        if (cat) {
          const inCat = availableProducts.filter(p => p.published && p.category?.id === cat.id).slice(0, 4);
          if (inCat.length > 0) {
            return { text: `Na categoria ${cat.name} temos:`, products: inCat };
          }
        }

        return {
          text: 'Desculpa, não encontrei nada com esse nome no catálogo. Posso te ajudar com alguma das opções abaixo? 😊',
          options: [...QUICK_MESSAGES.slice(0, 2), ...topCategories.slice(0, 1)],
        };
      }
    }
  };

  const addBotResponse = (userMessage: string) => {
    const response = buildReply(userMessage);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      playSound('message');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: response.text,
          sender: 'bot',
          timestamp: new Date(),
          options: response.options,
          products: response.products,
        },
      ]);
    }, 500 + Math.random() * 500);
  };

  const appendUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), text: text.trim(), sender: 'user', timestamp: new Date() }]);
    setInputValue('');
  };

  const appendBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now() + 1, text, sender: 'bot', timestamp: new Date() }]);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    playSound('send');

    // Quick-reply shortcuts generated by the bot itself — navigate instead of re-parsing as free text
    const campaignMatch = trimmed.match(/^Ver campanha (.+)$/i);
    if (campaignMatch) {
      const campaign = campaigns.find(c => c.name.toLowerCase() === campaignMatch[1].toLowerCase());
      if (campaign?.slug) {
        appendUserMessage(trimmed);
        appendBotMessage(`Levando você para a campanha "${campaign.name}"... 🔥`);
        setTimeout(() => { window.location.href = `/campanha/${campaign.slug}`; }, 900);
        return;
      }
    }
    const categoryMatch = trimmed.match(/^Ver (.+)$/i);
    if (categoryMatch) {
      const cat = categories.find(c => c.name.toLowerCase() === categoryMatch[1].toLowerCase());
      if (cat) {
        appendUserMessage(trimmed);
        appendBotMessage(`Abrindo a categoria "${cat.name}" no catálogo... 🌿`);
        setTimeout(() => { window.location.href = `/catalogo?category=${cat.id}`; }, 900);
        return;
      }
    }

    appendUserMessage(trimmed);

    const intent = detectIntent(trimmed);

    if (intent === 'seller') {
      setTimeout(() => {
        openWhatsApp('Olá! Vim pelo chat do site e gostaria de mais informações sobre os produtos! 🌸', user?.phone);
      }, 1000);
    }

    if (/voltar ao cat[aá]logo|^cat[aá]logo$/i.test(trimmed)) {
      setTimeout(() => {
        window.location.href = '/catalogo';
      }, 1500);
    }

    addBotResponse(trimmed);
  };

  const handleOptionClick = (option: string) => {
    handleSend(option);
  };

  const handleAddToCart = (p: ChatProduct) => {
    const priced = priceForProduct(p, campaigns);
    addItem({ productId: p.id, name: p.name, price: priced.price, image: p.images?.[0]?.image });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 btn-glass-pink-solid text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Abrir chat"
        >
          <ChatCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#de818d] to-[#c46878] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Xananas&apos; Garden</h3>
                <p className="text-white/70 text-xs">Assistente virtual • Online agora</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#de818d] text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                  {/* Product result cards — driven by the live catalog */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {msg.products.map(p => {
                        const priced = priceForProduct(p, campaigns);
                        return (
                          <div key={p.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-2">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                              {p.images?.[0]?.image ? (
                                <img src={p.images[0].image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={18} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/catalogo/${p.slug}`} className="text-xs font-medium text-gray-800 hover:text-[#de818d] line-clamp-1">
                                {p.name}
                              </Link>
                              <div className="flex items-center gap-1.5">
                                {priced.isPromo && <span className="text-[10px] text-gray-400 line-through">{formatBRL(priced.original)}</span>}
                                <span className="text-xs font-bold text-[#de818d]">{formatBRL(priced.price)}</span>
                                {p.amount === 0 && <span className="text-[10px] text-red-400">sem estoque</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              disabled={p.amount === 0}
                              title="Adicionar ao carrinho"
                              className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg btn-glass-pink-solid text-white disabled:opacity-40"
                            >
                              <ShoppingCart size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.options && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(option)}
                          className="text-xs btn-glass-pink px-2 py-1 rounded-full"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Cookie-based recommendation */}
            {viewedProducts.length > 0 && messages.length <= 1 && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-3">
                <p className="text-xs font-medium text-[#de818d] mb-2">💡 Baseado no seu interesse:</p>
                <div className="flex flex-wrap gap-1">
                  {viewedProducts.slice(-3).map((product, i) => (
                    <span key={i} className="text-xs bg-white border border-pink-200 text-gray-600 px-2 py-1 rounded-full">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="flex-1 p-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-[#de818d] px-4"
                placeholder="Ex: tem rosa do deserto?"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 btn-glass-pink-solid disabled:bg-gray-300 text-white rounded-full flex items-center justify-center"
              >
                <PaperPlaneTilt size={16} />
              </button>
            </form>
            {/* Quick messages */}
            <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
              {QUICK_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(msg)}
                  className="text-xs whitespace-nowrap bg-gray-100 hover:bg-[#de818d] hover:text-white text-gray-600 px-3 py-1 rounded-full transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
