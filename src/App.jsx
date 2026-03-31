import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

// ─── Lenis smooth scroll ──────────────────────────────────────────────────────

function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    return () => { lenis.destroy(); gsap.ticker.remove((time) => lenis.raf(time * 1000)) }
  }, [])
}

// ─── Text scramble hook ───────────────────────────────────────────────────────

function useScramble(text, trigger) {
  const [display, setDisplay] = useState(text)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'
  useEffect(() => {
    if (!trigger) return
    let iteration = 0
    const interval = setInterval(() => {
      setDisplay(text.split('').map((char, i) => {
        if (char === ' ') return ' '
        if (i < iteration) return text[i]
        return chars[Math.floor(Math.random() * chars.length)]
      }).join(''))
      if (iteration >= text.length) clearInterval(interval)
      iteration += 0.5
    }, 28)
    return () => clearInterval(interval)
  }, [trigger, text])
  return display
}

// ─── Magnetic button ─────────────────────────────────────────────────────────

function MagneticButton({ children, className, href, strength = 0.35 }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 18 })
  const sy = useSpring(y, { stiffness: 200, damping: 18 })

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.a
      ref={ref} href={href}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove} onMouseLeave={onLeave}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.a>
  )
}

// ─── Infinite marquee ─────────────────────────────────────────────────────────

function Marquee({ items, speed = 35 }) {
  return (
    <div className="overflow-hidden flex">
      {[0, 1].map(n => (
        <motion.div
          key={n}
          className="flex shrink-0 gap-12 pr-12"
          animate={{ x: ['0%', '-100%'] }}
          transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
        >
          {items.map((item, i) => (
            <span key={i} className="whitespace-nowrap text-[13px] font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-default">
              {item}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Split text reveal ────────────────────────────────────────────────────────

function SplitReveal({ text, className, delay = 0, tag = 'h2' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const words = text.split(' ')
  const Tag = tag

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.65, delay: delay + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

// ─── Fade reveal ─────────────────────────────────────────────────────────────

function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ value, suffix, decimals = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    gsap.fromTo({ val: 0 }, { val: value },
      { duration: 1.8, ease: 'power3.out', onUpdate: function() { setCount(this.targets()[0].val) } })
  }, [inView, value])

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('fr-FR')}{suffix}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function anonymize(name) {
  return name.split(' ').map((word, i) => {
    if (i === 0 || word.length <= 2) return word
    return word[0] + '*'.repeat(word.length - 1)
  }).join(' ')
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const RAW_CLIENTS = [
  'Naan Stop', 'Maison Perrin', 'Sushi Hana', "L'Atelier Fontaine",
  'Le Botaniste', 'Studio Bois', 'Boulangerie Dupré', "O'Tacos Express",
]
const CLIENTS = RAW_CLIENTS.map(anonymize)

const RESULTS = [
  { value: 38000, suffix: '€', decimals: 0, label: 'Économisés en commissions', sub: 'sur nos clients restaurants' },
  { value: 15, suffix: '+', decimals: 0, label: 'Sites livrés', sub: 'en Île-de-France' },
  { value: 11, suffix: ' j.', decimals: 0, label: 'Délai moyen', sub: 'de la signature à la mise en ligne' },
  { value: 4.9, suffix: '★', decimals: 1, label: 'Satisfaction', sub: 'basé sur 15 avis vérifiés' },
]

const FEATURES = [
  {
    category: 'Commande en ligne',
    title: 'Reprenez le contrôle de vos ventes.',
    description: 'Vos clients commandent directement sur votre site. Vous gardez 100% des revenus — sans reverser 25 à 35% à Uber Eats ou Deliveroo.',
    stats: [{ v: '0%', l: 'de commission' }, { v: '+340€', l: 'récupérés/mois en moyenne' }],
    dark: true,
  },
  {
    category: 'Visibilité locale',
    title: 'Soyez trouvé avant vos concurrents.',
    description: 'Chaque site Nova.IO est optimisé pour le référencement local. Vos futurs clients vous trouvent sur Google quand ils cherchent votre métier dans votre secteur.',
    stats: [{ v: 'Top 3', l: 'local en 3 mois en moyenne' }, { v: '+60%', l: 'de visites organiques' }],
    dark: false,
  },
  {
    category: 'Design sur mesure',
    title: 'Un site unique, jamais un template.',
    description: 'Chaque site est dessiné pour votre établissement. Couleurs, typographie, structure — tout reflète votre identité. Vos clients ressentent la différence dès la première seconde.',
    stats: [{ v: '100%', l: 'custom, zéro template' }, { v: '2×', l: 'plus de conversions vs template' }],
    dark: true,
  },
]

const PROCESS = [
  { n: '01', title: 'Découverte', body: 'Un appel de 30 min. On comprend votre activité, vos clients, ce que vous voulez transmettre.' },
  { n: '02', title: 'Conception', body: 'Maquette, textes, structure — tout préparé. Vous validez avant toute mise en production.' },
  { n: '03', title: 'Développement', body: 'Production en 5 à 7 jours. Lien de prévisualisation partagé en temps réel.' },
  { n: '04', title: 'Mise en ligne', body: 'Votre site en ligne sur votre domaine. Guide fourni. On reste disponibles.' },
]

const COMPARE = [
  { label: 'Prix', nova: '450 – 700€', agence: '2 000 – 8 000€', diy: 'Gratuit' },
  { label: 'Délai de livraison', nova: '2 semaines', agence: '2 – 4 mois', diy: 'Indéfini' },
  { label: 'Design sur mesure', nova: true, agence: true, diy: false },
  { label: 'SEO local inclus', nova: true, agence: 'Option payante', diy: false },
  { label: 'Commande en ligne', nova: true, agence: 'Option payante', diy: false },
  { label: 'Accompagnement', nova: true, agence: false, diy: false },
]

const TESTIMONIALS = [
  { name: 'Anwar M.', initials: 'AM', quote: "10 jours. Design, menu en ligne, domaine — tout géré. J'ai juste validé le résultat. Exactement ce que je cherchais depuis 2 ans." },
  { name: 'Claire P.', initials: 'CP', quote: "On est passés d'un site invisible à top 3 Google en 3 mois. On reçoit des appels de nouveaux clients chaque semaine." },
  { name: 'Karim D.', initials: 'KD', quote: "On a supprimé Uber Eats. On récupère plus de 400€ par mois. Le site s'est rentabilisé en 6 semaines. Meilleur investissement de l'année." },
  { name: 'Sofiane B.', initials: 'SB', quote: "J'avais peur que ce soit compliqué. C'était simple, rapide et le rendu est franchement beau. Mes clients m'en parlent encore." },
  { name: 'Nadia K.', initials: 'NK', quote: "On a lancé les commandes en ligne un vendredi. Le lundi, on avait déjà 12 commandes directes. Impressionnant." },
  { name: 'Thomas R.', initials: 'TR', quote: "Prix imbattable pour le résultat. Des devis à 3 000€ ailleurs. Nova.IO a livré mieux, plus vite, pour moins cher." },
  { name: 'Fatou D.', initials: 'FD', quote: "Mon site vitrine m'a permis de décrocher deux nouveaux contrats dans le mois qui a suivi la mise en ligne. ROI immédiat." },
  { name: 'Lucas M.', initials: 'LM', quote: "Réactif, professionnel, créatif. En 2 semaines j'avais un site que je n'aurais jamais pu faire seul en 6 mois. Vraiment bluffé." },
]

const PRICING = [
  {
    name: 'Nova Vitrine', price: '450', period: 'paiement en 2×', tagline: 'Artisans, TPE & commerçants',
    description: 'La présence en ligne qui rassure, distingue et convertit.',
    features: ['5 pages sur mesure', 'Design 100% unique', 'Responsive mobile & desktop', 'Formulaire de contact', 'SEO local Google', 'Hébergement + domaine 1 an', '2 tours de corrections'],
    highlight: false,
  },
  {
    name: 'Nova Menu', price: '700', period: 'paiement en 2×', tagline: 'Restaurants & food',
    description: 'Commandes directes, zéro commission. Votre meilleur commercial.',
    features: ['Commande en ligne intégrée', 'Menu digital modifiable', 'Paiement CB sécurisé', 'Click & collect + livraison', 'Design 100% unique', 'SEO local Google', 'Hébergement + domaine 1 an'],
    highlight: true,
  },
]

const FAQS = [
  { q: 'Combien coûte un site Nova.IO ?', a: 'Nos offres sont à prix fixe : 450€ pour Nova Vitrine et 700€ pour Nova Menu. Paiement en 2 fois disponible. Aucun frais caché.' },
  { q: 'En combien de temps mon site est-il en ligne ?', a: 'En moyenne 11 jours. Délai garanti : 2 semaines maximum à partir du brief signé.' },
  { q: 'Puis-je modifier mon site après la livraison ?', a: 'Oui — menu, horaires, photos. Tout modifiable depuis votre espace. Pour les changements complexes, nous intervenons.' },
  { q: 'Vous occupez-vous du domaine et de l\'hébergement ?', a: 'Oui, tout est inclus la première année. Domaine, hébergement, SSL, mise en ligne. Rien à gérer techniquement.' },
  { q: "Je n'ai ni logo ni photos. Est-ce un problème ?", a: 'Aucun problème. Nous créons l\'identité visuelle si besoin et sélectionnons des visuels professionnels. Vous arrivez les mains vides.' },
  { q: 'Vous travaillez avec tous types de restaurants ?', a: 'Oui — cuisine du monde, pizzerias, sushis, burgers, boulangeries, sur place, livraison, click & collect.' },
]

// ─── UI ───────────────────────────────────────────────────────────────────────

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Check({ light }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${light ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const links = ['Services', 'Résultats', 'Tarifs', 'FAQ']

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/96 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-500/25"
          >
            <span className="text-[11px] font-black text-white">N</span>
          </motion.div>
          <span className={`font-bold text-[15px] tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
            Nova<span className="text-violet-500">.IO</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l, i) => (
            <motion.a key={l} href={`#${l.toLowerCase()}`}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`text-[13px] font-medium px-3.5 py-2 rounded-lg transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              {l}
            </motion.a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#contact" className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/70 hover:text-white'}`}>Contact</a>
          <MagneticButton href="#contact" className="bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
            Démarrer un projet →
          </MagneticButton>
        </div>

        <button onClick={() => setOpen(!open)} className={`md:hidden p-2 ${scrolled ? 'text-gray-700' : 'text-white'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/98 backdrop-blur border-t border-gray-100 px-6 overflow-hidden"
          >
            <div className="py-5 flex flex-col gap-1">
              {[...links, 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
                  className="text-[13px] font-medium text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50">{l}</a>
              ))}
              <a href="#contact" onClick={() => setOpen(false)}
                className="mt-2 bg-gray-900 text-white text-[13px] font-semibold px-4 py-3 rounded-lg text-center">
                Démarrer un projet →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function Hero() {
  const ref = useRef(null)
  const titleRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 140])
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96])

  const inView = useInView(titleRef, { once: true })
  const scrambled = useScramble('NOVA.IO', inView)

  // GSAP horizontal line reveal on hero text
  useEffect(() => {
    if (!titleRef.current) return
    gsap.fromTo(titleRef.current,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 1.1, delay: 0.4, ease: 'power4.inOut' }
    )
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen bg-[#080912] flex items-center overflow-hidden">
      {/* Fine grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Animated glows */}
      <motion.div style={{ y }}
        className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-violet-600/12 rounded-full blur-[180px] pointer-events-none" />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-700/10 rounded-full blur-[140px] pointer-events-none"
      />

      <motion.div style={{ opacity, scale }} className="relative mx-auto max-w-6xl px-6 pt-32 pb-28 w-full">

        {/* Scramble badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="inline-flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-full px-5 py-2 mb-10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-emerald-400">{scrambled}</span>
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gray-500">· Disponible · Île-de-France</span>
        </motion.div>

        {/* Main headline — split word reveal */}
        <div className="mb-6 max-w-4xl">
          <div className="overflow-hidden mb-1">
            <motion.p
              initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[56px] md:text-[84px] font-black text-white leading-[1.02] tracking-[-0.03em]"
            >
              Des sites web qui
            </motion.p>
          </div>
          <div className="overflow-hidden">
            <motion.p
              ref={titleRef}
              initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[56px] md:text-[84px] font-black leading-[1.02] tracking-[-0.03em] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-500 to-fuchsia-500"
            >
              font gagner de l'argent.
            </motion.p>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-[17px] text-gray-400 leading-[1.7] max-w-xl mb-10"
        >
          Nova.IO conçoit des sites professionnels pour les restaurants et artisans.
          Livré en 2 semaines, clé en main. À partir de{' '}
          <span className="text-white font-semibold">450€</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.62 }}
          className="flex flex-col sm:flex-row gap-3 mb-16"
        >
          <MagneticButton href="#contact"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-[14px] px-8 py-4 rounded-xl hover:bg-violet-500 transition-colors shadow-2xl shadow-violet-900/50">
            Démarrer mon projet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </MagneticButton>
          <MagneticButton href="#résultats"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white font-semibold text-[14px] px-8 py-4 rounded-xl hover:bg-white/[0.10] transition-colors">
            Voir nos résultats
          </MagneticButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.72 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06] max-w-xl"
        >
          {[
            { v: 15, s: '+', d: 0, l: 'Sites livrés' },
            { v: 2, s: ' sem.', d: 0, l: 'Délai garanti' },
            { v: 38, s: 'k€', d: 0, l: 'Économisés' },
            { v: 4.9, s: '★', d: 1, l: 'Satisfaction' },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.07 }}
              className="bg-white/[0.03] px-5 py-5"
            >
              <div className="text-[22px] font-black text-white leading-none">
                <Counter value={s.v} suffix={s.s} decimals={s.d} />
              </div>
              <div className="text-[11px] text-gray-600 uppercase tracking-wider mt-1.5">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}

function TrustBar() {
  return (
    <section className="bg-white border-b border-gray-100 py-10 overflow-hidden">
      <Reveal className="mb-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Ils nous font confiance
        </p>
      </Reveal>
      <Marquee items={[...CLIENTS, ...CLIENTS]} speed={28} />
    </section>
  )
}

function Results() {
  return (
    <section id="résultats" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Résultats</p>
            </Reveal>
            <SplitReveal text="Des chiffres qui parlent d'eux-mêmes." delay={0.05}
              className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-5" />
            <Reveal delay={0.2}>
              <p className="text-[15px] text-gray-500 leading-[1.7] max-w-md">
                Chaque site Nova.IO est conçu pour générer des résultats concrets — plus de clients, plus de commandes, moins de commissions perdues.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {RESULTS.map((r, i) => (
              <Reveal key={r.label} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 20px 40px -8px rgba(139,92,246,0.12)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 cursor-default"
                >
                  <div className="text-[32px] font-black text-gray-900 tracking-tight leading-none mb-2">
                    <Counter value={r.value} suffix={r.suffix} decimals={r.decimals} />
                  </div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">{r.label}</div>
                  <div className="text-[12px] text-gray-400 leading-snug">{r.sub}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="services" className="bg-gray-50 py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Services</p></Reveal>
          <SplitReveal text="Tout pour exister en ligne. Rien de superflu."
            className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-4" />
        </div>

        <div className="flex flex-col gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={0.05}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                className={`rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-10 md:gap-20 items-start ${f.dark ? 'bg-gray-950' : 'bg-white border border-gray-100'}`}
              >
                <div className="flex-1">
                  <motion.span
                    initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                    className={`inline-block text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1 rounded-full mb-5 ${f.dark ? 'bg-white/10 text-violet-400' : 'bg-violet-50 text-violet-700'}`}
                  >
                    {f.category}
                  </motion.span>
                  <h3 className={`text-[26px] md:text-[32px] font-black tracking-tight leading-tight mb-4 ${f.dark ? 'text-white' : 'text-gray-900'}`}>
                    {f.title}
                  </h3>
                  <p className={`text-[15px] leading-[1.7] ${f.dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.description}</p>
                </div>
                <div className="md:w-60 shrink-0 flex flex-col gap-4">
                  {f.stats.map((s, j) => (
                    <motion.div key={j}
                      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: 0.15 + j * 0.1 }}
                      className={`rounded-2xl px-6 py-5 ${f.dark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50 border border-gray-100'}`}
                    >
                      <div className={`text-[32px] font-black leading-none ${f.dark ? 'text-white' : 'text-gray-900'}`}>{s.v}</div>
                      <div className={`text-[12px] mt-1.5 ${f.dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.l}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Process() {
  const lineRef = useRef(null)

  useEffect(() => {
    if (!lineRef.current) return
    gsap.fromTo(lineRef.current,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: lineRef.current, start: 'top 80%' } })
  }, [])

  return (
    <section className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Processus</p></Reveal>
          <SplitReveal text="De 0 à en ligne en 2 semaines."
            className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1]" />
        </div>

        <div className="relative">
          {/* Animated progress line */}
          <div className="hidden lg:block absolute top-7 left-[4.5%] right-[4.5%] h-px bg-gray-100 z-0">
            <div ref={lineRef} className="h-full bg-violet-200" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {PROCESS.map((p, i) => (
              <motion.div key={p.n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.12 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(139,92,246,0.15)' }}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-7 cursor-default"
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 12 }}
                    className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-[11px] font-black shrink-0"
                  >
                    {p.n}
                  </motion.div>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Compare() {
  return (
    <section className="bg-gray-950 py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400 mb-4">Comparatif</p></Reveal>
          <SplitReveal text="Pourquoi Nova.IO ?" className="text-[38px] md:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.1]" />
        </div>

        <Reveal>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-4 bg-white/[0.04] border-b border-white/[0.08]">
              <div className="p-5" />
              <div className="p-5 text-center">
                <div className="inline-flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg px-3 py-1.5">
                  <span className="text-[12px] font-bold text-violet-400">Nova.IO</span>
                </div>
              </div>
              <div className="p-5 text-center text-[12px] font-semibold text-gray-600">Agence classique</div>
              <div className="p-5 text-center text-[12px] font-semibold text-gray-600">DIY</div>
            </div>
            {COMPARE.map((row, i) => (
              <motion.div key={row.label}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                className={`grid grid-cols-4 ${i < COMPARE.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
              >
                <div className="p-5 text-[13px] font-medium text-gray-400">{row.label}</div>
                {[row.nova, row.agence, row.diy].map((val, j) => (
                  <div key={j} className={`p-5 flex justify-center items-center ${j === 0 ? 'bg-violet-600/[0.06]' : ''}`}>
                    {val === true
                      ? <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      : val === false
                        ? <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg className="w-3 h-3 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        : <span className={`text-[12px] font-semibold text-center ${j === 0 ? 'text-violet-300' : 'text-gray-500'}`}>{val}</span>
                    }
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Avis clients</p></Reveal>
          <SplitReveal text="Ils en parlent mieux que nous."
            className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1]" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -8, boxShadow: '0 28px 48px -12px rgba(139,92,246,0.15)' }}
              className="flex flex-col bg-gray-50 border border-gray-100 rounded-2xl p-6 cursor-default"
            >
              <Stars />
              <p className="flex-1 mt-4 text-[13px] text-gray-700 leading-[1.75]">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {t.initials}
                </div>
                <span className="text-[13px] font-bold text-gray-900">{t.name}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Second marquee of quotes */}
        <div className="mt-10 overflow-hidden">
          <Marquee
            items={TESTIMONIALS.map(t => `"${t.quote.slice(0, 60)}…" — ${t.name}`)}
            speed={45}
          />
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="tarifs" className="bg-gray-50 py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Tarifs</p></Reveal>
          <SplitReveal text="Prix fixes. Zéro surprise."
            className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-4" />
          <Reveal delay={0.2}>
            <p className="text-[15px] text-gray-500 max-w-md mx-auto">Un prix annoncé dès le début, sans devis en 12 lignes.</p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {PRICING.map((plan, i) => (
            <motion.div key={plan.name}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className={`flex flex-col rounded-3xl overflow-hidden ${plan.highlight ? 'bg-gray-950 shadow-2xl shadow-gray-900/40' : 'bg-white border border-gray-200'}`}
            >
              {plan.highlight && (
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-violet-200" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[11px] font-bold text-violet-100 tracking-wider uppercase">Le plus demandé</span>
                </div>
              )}
              <div className="p-8 flex flex-col flex-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 ${plan.highlight ? 'text-violet-400' : 'text-violet-600'}`}>{plan.tagline}</p>
                <h3 className={`text-[22px] font-black mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-2 mt-4 mb-5">
                  <span className={`text-[52px] font-black leading-none tracking-tight ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}€</span>
                  <span className={`text-[12px] ${plan.highlight ? 'text-gray-600' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-[13px] mb-7 leading-relaxed ${plan.highlight ? 'text-gray-500' : 'text-gray-500'}`}>{plan.description}</p>
                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <motion.li key={f}
                      initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: j * 0.05 }}
                      className="flex items-center gap-2.5 text-[13px]"
                    >
                      <Check light={plan.highlight} />
                      <span className={plan.highlight ? 'text-gray-400' : 'text-gray-600'}>{f}</span>
                    </motion.li>
                  ))}
                </ul>
                <MagneticButton href="#contact"
                  className={`text-center font-bold text-[14px] py-3.5 rounded-xl transition-all block ${plan.highlight ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/30' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                  Choisir {plan.name}
                </MagneticButton>
              </div>
            </motion.div>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p className="text-center text-[12px] text-gray-400 mt-6">
            Maintenance à partir de 50€/mois · SEO avancé · Devis sur mesure sur demande
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="bg-white py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">FAQ</p></Reveal>
          <SplitReveal text="Questions fréquentes." className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1]" />
        </div>
        <div className="divide-y divide-gray-100">
          {FAQS.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-6 group">
                <span className="text-[14px] font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">{item.q}</span>
                <motion.svg animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className="text-[13px] text-gray-500 leading-relaxed overflow-hidden"
                  >
                    {item.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="relative bg-[#080912] py-36 px-6 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-violet-600/15 blur-[220px] rounded-full pointer-events-none"
      />
      {/* Floating orbs */}
      <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 right-[15%] w-48 h-48 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 20, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-[10%] w-64 h-64 bg-indigo-600/08 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <SplitReveal text="Prêt à avoir un site qui vous ressemble ?"
          className="text-[40px] md:text-[56px] font-black text-white tracking-[-0.02em] leading-[1.1] mb-5" />
        <Reveal delay={0.2}>
          <p className="text-[16px] text-gray-500 mb-10 max-w-md mx-auto">Premier échange gratuit. Sans engagement.</p>
        </Reveal>
        <Reveal delay={0.3}>
          <MagneticButton href="#contact" strength={0.25}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-[15px] px-10 py-4.5 rounded-xl hover:bg-gray-100 transition-colors shadow-2xl py-4">
            Démarrer mon projet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  return (
    <section id="contact" className="bg-gray-50 py-28 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Contact</p></Reveal>
          <SplitReveal text="Parlons de votre projet." className="text-[38px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-3" />
          <Reveal delay={0.15}><p className="text-[14px] text-gray-500">Réponse sous 24h · Premier échange offert</p></Reveal>
        </div>

        <Reveal delay={0.1}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
                <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">Message reçu !</h3>
                <p className="text-[13px] text-gray-500">Nous vous répondons sous 24h ouvrées.</p>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onSubmit={e => { e.preventDefault(); setSent(true) }}
                className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-5 shadow-sm"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  {[['Prénom', 'text', 'Jean', true], ['Établissement', 'text', 'Mon Restaurant', true]].map(([l, t, p, r]) => (
                    <div key={l} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{l}</label>
                      <input required={r} type={t} placeholder={p}
                        className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                    </div>
                  ))}
                </div>
                {[['Email', 'email', 'jean@monresto.fr', true], ['Téléphone', 'tel', '06 00 00 00 00', false]].map(([l, t, p, r]) => (
                  <div key={l} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{l}</label>
                    <input required={r} type={t} placeholder={p}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Offre</label>
                  <select className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option>Nova Menu — Restaurant (700€)</option>
                    <option>Nova Vitrine — Artisan / TPE (450€)</option>
                    <option>Je ne sais pas encore</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Message</label>
                  <textarea rows={3} placeholder="Décrivez votre projet..."
                    className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all" />
                </div>
                <MagneticButton href={null}
                  className="bg-gray-900 text-white font-bold text-[14px] py-3.5 rounded-xl hover:bg-violet-700 transition-colors mt-1 flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setSent(true)}
                >
                  Envoyer ma demande
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </MagneticButton>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  const cols = {
    Services: ['Site de commande en ligne', 'Site vitrine', 'SEO local', 'Design sur mesure'],
    Entreprise: ['À propos', 'Réalisations', 'Tarifs', 'Contact'],
  }
  return (
    <footer className="bg-[#080912] border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center">
                <span className="text-[11px] font-black text-white">N</span>
              </div>
              <span className="font-bold text-[15px] tracking-tight text-white">Nova<span className="text-violet-500">.IO</span></span>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed max-w-xs">
              Sites web professionnels pour les restaurants et artisans d'Île-de-France. Livraison en 2 semaines.
            </p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-600 mb-4">{title}</h4>
              <ul className="flex flex-col gap-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-gray-600 hover:text-gray-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-gray-700">© 2026 Nova.IO — Tous droits réservés</p>
          <div className="flex gap-5">
            {['Mentions légales', 'Confidentialité'].map(l => (
              <a key={l} href="#" className="text-[12px] text-gray-700 hover:text-gray-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  useLenis()

  return (
    <div className="min-h-screen font-sans antialiased">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Results />
        <Features />
        <Process />
        <Compare />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
