import { useState, useEffect, useRef, useCallback } from 'react'
import emailjs from '@emailjs/browser'
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

  const Tag = href ? motion.a : motion.button
  return (
    <Tag
      ref={ref} href={href || undefined} type={href ? undefined : 'submit'}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove} onMouseLeave={onLeave}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </Tag>
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

const PORTFOLIO = [
  {
    name: 'Le Taj M***', type: 'Restaurant indien', tag: 'Nova Menu',
    description: 'Commande en ligne, menu digital, click & collect. Uber Eats supprimé en 3 semaines.',
    stats: ['+340€/mois récupérés', 'Livré en 10 j.'],
    color: 'from-amber-500/20 to-orange-600/10', accent: 'bg-amber-500',
  },
  {
    name: 'Électro B***', type: 'Artisan électricien', tag: 'Nova Vitrine',
    description: 'Site vitrine 5 pages, formulaire devis, SEO local optimisé.',
    stats: ['Top 3 Google local', 'Livré en 9 j.'],
    color: 'from-blue-500/20 to-indigo-600/10', accent: 'bg-blue-500',
  },
  {
    name: 'Boulangerie M***', type: 'Boulangerie artisanale', tag: 'Nova Vitrine',
    description: 'Vitrine moderne, horaires, carte produits, intégration Google Maps.',
    stats: ['+60% visites organiques', 'Livré en 11 j.'],
    color: 'from-rose-500/20 to-pink-600/10', accent: 'bg-rose-500',
  },
]

const SOCIAL_PROOFS = [
  { name: 'Karim', city: 'Paris 18e' },
  { name: 'Marie', city: 'Paris 11e' },
  { name: 'Sofiane', city: 'Paris 20e' },
  { name: 'Nadia', city: 'Paris 15e' },
  { name: 'Thomas', city: 'Paris 9e' },
  { name: 'Fatou', city: 'Paris 13e' },
  { name: 'Lucas', city: 'Paris 10e' },
  { name: 'Anwar', city: 'Paris 19e' },
  { name: 'Claire', city: 'Paris 12e' },
  { name: 'Rayan', city: 'Paris 14e' },
]

const SPOTS_REMAINING = 3
const CURRENT_MONTH = 'avril'

const ZONES = [
  'Paris (75)', 'Clichy', 'Levallois-Perret', 'Neuilly-sur-Seine', 'Courbevoie',
  'Nanterre', 'Boulogne-Billancourt', 'Issy-les-Moulineaux', 'Saint-Denis',
  'Montreuil', 'Vincennes', 'Créteil', 'Versailles', 'Argenteuil', 'Colombes',
  'Asnières-sur-Seine', 'Rueil-Malmaison', 'Suresnes', 'Puteaux', 'Gennevilliers',
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
  const links = ['Services', 'Portfolio', 'Résultats', 'Tarifs', 'FAQ']

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
        <a href="#" className="flex items-center">
          <motion.img
            src="/logo.png"
            alt="Nova.io"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="h-9 w-auto rounded-lg object-contain"
          />
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
              className="text-[42px] sm:text-[56px] md:text-[84px] font-black text-white leading-[1.02] tracking-[-0.03em]"
            >
              Des sites web qui
            </motion.p>
          </div>
          <div className="overflow-hidden">
            <motion.p
              ref={titleRef}
              initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-[42px] sm:text-[56px] md:text-[84px] font-black leading-[1.02] tracking-[-0.03em] text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-500 to-fuchsia-500"
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
          className="flex flex-col sm:flex-row gap-3 mb-6"
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

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.72 }}
          className="flex flex-wrap gap-3 mb-14"
        >
          {[
            { icon: '⚡', label: 'Livré en 2 semaines' },
            { icon: '💳', label: 'Paiement en 2×' },
            { icon: '🔒', label: 'Sans engagement' },
          ].map(({ icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 text-[12px] font-medium text-gray-400">
              <span>{icon}</span>{label}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-[12px] font-medium text-amber-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
            </span>
            {SPOTS_REMAINING} créneaux disponibles en {CURRENT_MONTH}
          </span>
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
  const [active, setActive] = useState(0)
  const lastSwipe = useRef(0)

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FEATURES.length), 7000)
    return () => clearInterval(t)
  }, [])

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) < 20) return
    const now = Date.now()
    if (now - lastSwipe.current < 600) return
    lastSwipe.current = now
    if (e.deltaX > 0) setActive(i => (i + 1) % FEATURES.length)
    else setActive(i => (i - 1 + FEATURES.length) % FEATURES.length)
  }

  const f = FEATURES[active]

  return (
    <section id="services" className="bg-gray-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Services</p></Reveal>
          <SplitReveal text="Tout pour exister en ligne. Rien de superflu."
            className="text-[32px] md:text-[42px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-4" />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {FEATURES.map((item, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`text-[12px] font-semibold px-5 py-2.5 rounded-full transition-all duration-300 ${active === i ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {item.category}
            </button>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onWheel={handleWheel}
            className={`rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 md:gap-16 items-start ${f.dark ? 'bg-gray-950' : 'bg-white border border-gray-100'}`}
          >
            <div className="flex-1">
              <span className={`inline-block text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1 rounded-full mb-5 ${f.dark ? 'bg-white/10 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>
                {f.category}
              </span>
              <h3 className={`text-[24px] md:text-[30px] font-black tracking-tight leading-tight mb-4 ${f.dark ? 'text-white' : 'text-gray-900'}`}>
                {f.title}
              </h3>
              <p className={`text-[14px] leading-[1.7] ${f.dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.description}</p>
            </div>
            <div className="md:w-52 shrink-0 flex flex-col gap-3">
              {f.stats.map((s, j) => (
                <div key={j} className={`rounded-2xl px-5 py-4 ${f.dark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`text-[28px] font-black leading-none ${f.dark ? 'text-white' : 'text-gray-900'}`}>{s.v}</div>
                  <div className={`text-[11px] mt-1 ${f.dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {FEATURES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-2 bg-violet-600' : 'w-2 h-2 bg-gray-300'}`}
            />
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
    <section className="bg-gray-950 py-28 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400 mb-4">Comparatif</p></Reveal>
          <SplitReveal text="Pourquoi Nova.IO ?" className="text-[38px] md:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.1]" />
        </div>

        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <div className="min-w-[380px]">
              <div className="grid grid-cols-4 bg-white/[0.04] border-b border-white/[0.08]">
                <div className="p-3 md:p-5" />
                <div className="p-3 md:p-5 text-center">
                  <div className="inline-flex items-center gap-1 bg-violet-600/20 border border-violet-500/30 rounded-lg px-2 py-1">
                    <span className="text-[11px] font-bold text-violet-400">Nova.IO</span>
                  </div>
                </div>
                <div className="p-3 md:p-5 text-center text-[10px] md:text-[12px] font-semibold text-gray-600 leading-tight">Agence classique</div>
                <div className="p-3 md:p-5 text-center text-[10px] md:text-[12px] font-semibold text-gray-600">DIY</div>
              </div>
              {COMPARE.map((row, i) => (
                <motion.div key={row.label}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                  className={`grid grid-cols-4 ${i < COMPARE.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                >
                  <div className="p-3 md:p-5 text-[11px] md:text-[13px] font-medium text-gray-400 leading-snug">{row.label}</div>
                  {[row.nova, row.agence, row.diy].map((val, j) => (
                    <div key={j} className={`p-3 md:p-5 flex justify-center items-center ${j === 0 ? 'bg-violet-600/[0.06]' : ''}`}>
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
                          : <span className={`text-[10px] md:text-[12px] font-semibold text-center leading-tight ${j === 0 ? 'text-violet-300' : 'text-gray-500'}`}>{val}</span>
                      }
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function TestimonialCard({ t }) {
  return (
    <div className="flex flex-col bg-gray-50 border border-gray-100 rounded-2xl p-6 w-[300px] shrink-0">
      <Stars />
      <p className="flex-1 mt-4 text-[13px] text-gray-700 leading-[1.75]">&ldquo;{t.quote}&rdquo;</p>
      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {t.initials}
        </div>
        <span className="text-[13px] font-bold text-gray-900">{t.name}</span>
      </div>
    </div>
  )
}

function Testimonials() {
  const [idx, setIdx] = useState(0)
  const total = TESTIMONIALS.length

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % total), 3500)
    return () => clearInterval(t)
  }, [total])

  return (
    <section className="bg-white py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Avis clients</p></Reveal>
          <SplitReveal text="Ils en parlent mieux que nous."
            className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1]" />
        </div>
      </div>

      {/* Row 1 — scroll left */}
      <div className="relative mb-4 overflow-hidden">
        <motion.div
          animate={{ x: [`0%`, `-50%`] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-4 w-max"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </motion.div>
      </div>

      {/* Row 2 — scroll right */}
      <div className="relative overflow-hidden">
        <motion.div
          animate={{ x: [`-50%`, `0%`] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="flex gap-4 w-max"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </motion.div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-10">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-300 ${i === idx % total ? 'w-5 h-2 bg-violet-600' : 'w-2 h-2 bg-gray-200'}`}
          />
        ))}
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
        <Reveal delay={0.15}>
          <div className="flex items-center justify-center gap-2 mt-8 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <p className="text-[13px] font-semibold text-amber-600">
              Plus que <span className="font-black">{SPOTS_REMAINING} créneaux</span> disponibles en {CURRENT_MONTH}
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-0.5">Nova Care — Maintenance</p>
                <p className="text-[12px] text-gray-500">Mises à jour, sauvegardes, corrections mineures, rapport Analytics mensuel.</p>
                <p className="text-[13px] font-black text-violet-600 mt-2">29€ / mois</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-0.5">Pack Refonte</p>
                <p className="text-[12px] text-gray-500">Vous avez un vieux site Wix ou WordPress ? On le modernise complètement.</p>
                <p className="text-[13px] font-black text-indigo-600 mt-2">Devis sur mesure</p>
              </div>
            </div>
          </div>
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
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await emailjs.sendForm(
        'service_p9cnp08',
        'template_xcolvf2',
        formRef.current,
        'uCuF6ko_sS7czsOPQ'
      )
      setSent(true)
    } catch {
      alert('Une erreur est survenue. Réessayez ou contactez-nous directement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="bg-gray-50 py-28 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Contact</p></Reveal>
          <SplitReveal text="Parlons de votre projet." className="text-[38px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1] mb-3" />
          <Reveal delay={0.15}>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                Réponse sous 2h
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[13px] text-gray-500">Premier échange offert</span>
              <span className="text-gray-300">·</span>
              <span className="text-[13px] text-gray-500">Sans engagement</span>
            </div>
          </Reveal>
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
              <motion.form ref={formRef} key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-5 shadow-sm"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Prénom</label>
                    <input name="from_name" required type="text" placeholder="Jean"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Établissement</label>
                    <input name="establishment" required type="text" placeholder="Mon Restaurant"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Email</label>
                  <input name="from_email" required type="email" placeholder="jean@monresto.fr"
                    className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Téléphone</label>
                  <input name="phone" type="tel" placeholder="06 00 00 00 00"
                    className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Offre</label>
                  <select name="project" className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option>Nova Menu — Restaurant (700€)</option>
                    <option>Nova Vitrine — Artisan / TPE (450€)</option>
                    <option>Je ne sais pas encore</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Message</label>
                  <textarea name="message" rows={3} placeholder="Décrivez votre projet..."
                    className="border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all" />
                </div>
                <MagneticButton href={null}
                  className="bg-gray-900 text-white font-bold text-[14px] py-3.5 rounded-xl hover:bg-violet-700 transition-colors mt-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  onClick={null}
                >
                  {loading ? 'Envoi en cours…' : 'Envoyer ma demande'}
                  {!loading && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </MagneticButton>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}

function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(mx, { stiffness: 80, damping: 18 })
  const ry = useSpring(my, { stiffness: 80, damping: 18 })

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mx, my])

  return (
    <>
      <motion.div ref={dot} style={{ x: mx, y: my, translateX: '-50%', translateY: '-50%' }}
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-violet-500 rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block" />
      <motion.div ref={ring} style={{ x: rx, y: ry, translateX: '-50%', translateY: '-50%' }}
        className="fixed top-0 left-0 w-9 h-9 border border-violet-400/40 rounded-full pointer-events-none z-[9998] hidden md:block" />
    </>
  )
}

function SocialProofToast() {
  const [toast, setToast] = useState(null)
  const shown = useRef(new Set())

  useEffect(() => {
    const show = () => {
      const remaining = SOCIAL_PROOFS.filter((_, i) => !shown.current.has(i))
      if (remaining.length === 0) return
      const idx = Math.floor(Math.random() * remaining.length)
      const item = remaining[idx]
      shown.current.add(SOCIAL_PROOFS.indexOf(item))
      setToast(item)
      setTimeout(() => setToast(null), 4500)
    }
    const t1 = setTimeout(show, 6000)
    const interval = setInterval(show, 55000 + Math.random() * 30000)
    return () => { clearTimeout(t1); clearInterval(interval) }
  }, [])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.name}
          initial={{ opacity: 0, y: 20, x: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-24 left-4 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-[260px]"
        >
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-[13px]">🔔</div>
          <p className="text-[12px] text-gray-700 leading-snug">
            <span className="font-bold">{toast.name}</span> de <span className="font-bold">{toast.city}</span> vient de démarrer un projet
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ExitPopup() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const triggered = useRef(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.clientY < 8 && !triggered.current) {
        triggered.current = true
        setTimeout(() => setShow(true), 300)
      }
    }
    document.addEventListener('mouseleave', handler)
    return () => document.removeEventListener('mouseleave', handler)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-black text-gray-900 mb-2">C'est noté !</h3>
                <p className="text-[13px] text-gray-500">On vous envoie votre estimation sous 2h.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-[28px] mb-2">⚡</p>
                  <h3 className="text-[22px] font-black text-gray-900 mb-2">Avant de partir…</h3>
                  <p className="text-[14px] text-gray-500">Recevez une estimation gratuite pour votre site en moins de 2 minutes.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={() => { if (email) setDone(true) }}
                    className="bg-violet-600 text-white font-semibold text-[13px] px-4 py-3 rounded-xl hover:bg-violet-500 transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-3">Aucun spam. Réponse sous 2h.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ROICalculator() {
  const [revenue, setRevenue] = useState('')
  const rate = 0.30
  const monthly = revenue ? Math.round(parseFloat(revenue) * rate) : 0
  const annual = monthly * 12
  const months = monthly > 0 ? Math.ceil(700 / monthly) : 0

  return (
    <section className="bg-[#080912] py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400 mb-4">Calculateur ROI</p></Reveal>
          <SplitReveal text="Combien perdez-vous vraiment ?" className="text-[32px] md:text-[44px] font-black text-white tracking-[-0.02em] leading-[1.1]" />
          <Reveal delay={0.1}><p className="text-[15px] text-gray-500 mt-4">Entrez votre chiffre d'affaires mensuel sur les plateformes de livraison.</p></Reveal>
        </div>
        <Reveal delay={0.15}>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8">
            <div className="mb-8">
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-3 block">CA mensuel Uber Eats / Deliveroo (€)</label>
              <div className="relative">
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  value={revenue} onChange={e => setRevenue(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ex : 5 000"
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-2xl pl-6 pr-14 py-4 text-[24px] font-black text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[22px] font-black text-gray-600 pointer-events-none">€</span>
              </div>
            </div>
            {monthly > 0 ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-3 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-2">Perdu / mois</p>
                  <p className="text-[32px] font-black text-red-400">-{monthly.toLocaleString('fr-FR')}€</p>
                  <p className="text-[11px] text-gray-600 mt-1">en commissions (30%)</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-2">Perdu / an</p>
                  <p className="text-[32px] font-black text-red-400">-{annual.toLocaleString('fr-FR')}€</p>
                  <p className="text-[11px] text-gray-600 mt-1">partis en commissions</p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-2">Rentabilisé en</p>
                  <p className="text-[32px] font-black text-violet-400">{months} mois</p>
                  <p className="text-[11px] text-gray-600 mt-1">avec Nova Menu à 700€</p>
                </div>
              </motion.div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {['Perdu / mois', 'Perdu / an', 'Rentabilisé en'].map(l => (
                  <div key={l} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">{l}</p>
                    <p className="text-[32px] font-black text-gray-700">—</p>
                  </div>
                ))}
              </div>
            )}
            {monthly > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-center">
                <MagneticButton href="#contact"
                  className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold text-[14px] px-8 py-3.5 rounded-xl hover:bg-violet-500 transition-colors">
                  Récupérer mes {monthly.toLocaleString('fr-FR')}€/mois →
                </MagneticButton>
              </motion.div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Portfolio() {
  return (
    <section id="portfolio" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Réalisations</p></Reveal>
          <SplitReveal text="Nos derniers projets." className="text-[38px] md:text-[48px] font-black text-gray-900 tracking-[-0.02em] leading-[1.1]" />
          <Reveal delay={0.1}><p className="text-[15px] text-gray-500 mt-4 max-w-xl mx-auto">Des sites qui travaillent pour nos clients, même quand ils dorment.</p></Reveal>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PORTFOLIO.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl bg-gradient-to-br ${p.color} border border-gray-100 p-7 flex flex-col gap-4 hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">{p.type}</p>
                  <h3 className="text-[18px] font-black text-gray-900">{p.name}</h3>
                </div>
                <span className={`${p.accent} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}>{p.tag}</span>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{p.description}</p>
              <div className="flex gap-3 mt-auto pt-2">
                {p.stats.map(s => (
                  <span key={s} className="text-[11px] font-semibold text-gray-700 bg-white/70 border border-gray-100 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="text-center mt-10">
            <p className="text-[13px] text-gray-400 mb-4">Votre établissement pourrait être le prochain.</p>
            <MagneticButton href="#contact"
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold text-[14px] px-7 py-3 rounded-xl hover:bg-violet-700 transition-colors">
              Démarrer mon projet →
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Calendly() {
  return (
    <section className="bg-[#080912] py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400 mb-4">Réserver un appel</p></Reveal>
        <SplitReveal text="30 minutes. Gratuit. Sans engagement." className="text-[32px] md:text-[44px] font-black text-white tracking-[-0.02em] leading-[1.1] mb-5" />
        <Reveal delay={0.1}>
          <p className="text-[15px] text-gray-500 mb-10 max-w-md mx-auto">
            On analyse votre situation, on vous explique ce qu'on peut faire. Vous repartez avec un plan clair — même si vous ne signez pas.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://calendly.com/nova-iocontact/30min" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-[14px] px-8 py-4 rounded-xl hover:bg-violet-500 transition-colors shadow-2xl shadow-violet-900/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choisir un créneau
            </a>
            <a href="https://wa.me/33783904743" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white font-semibold text-[14px] px-8 py-4 rounded-xl hover:bg-white/[0.10] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Zones() {
  return (
    <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">Zones d'intervention</p></Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-[26px] font-black text-gray-900 tracking-tight mb-2">Création de sites web en Île-de-France</h2>
          <p className="text-[13px] text-gray-500 mb-10">Nous intervenons dans toute l'Île-de-France pour les restaurants, artisans et TPE locaux.</p>
        </Reveal>
        <div className="flex flex-wrap gap-2 justify-center">
          {ZONES.map((ville, i) => (
            <motion.span key={ville}
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              className="text-[12px] font-medium text-gray-600 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full hover:border-violet-400 hover:text-violet-700 transition-colors"
            >
              {ville}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhatsAppButton() {
  return (
    <a href="https://wa.me/33783904743" target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
      aria-label="Contacter sur WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

function Footer({ onLegal }) {
  const cols = {
    Services: ['Site de commande en ligne', 'Site vitrine', 'SEO local', 'Design sur mesure'],
    Entreprise: ['À propos', 'Réalisations', 'Tarifs', 'Contact'],
  }
  return (
    <footer className="bg-[#080912] border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/logo.png" alt="Nova.io" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed max-w-xs">
              Sites web professionnels pour les restaurants et artisans d&apos;Île-de-France. Livraison en 2 semaines.
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
            <button onClick={() => onLegal('mentions')} className="text-[12px] text-gray-700 hover:text-gray-400 transition-colors">Mentions légales</button>
            <button onClick={() => onLegal('cgv')} className="text-[12px] text-gray-700 hover:text-gray-400 transition-colors">CGV</button>
            <button onClick={() => onLegal('confidentialite')} className="text-[12px] text-gray-700 hover:text-gray-400 transition-colors">Confidentialité</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Legal modal ─────────────────────────────────────────────────────────────

const LEGAL_CONTENT = {
  mentions: {
    title: 'Mentions légales',
    sections: [
      {
        heading: 'Éditeur du site',
        body: `Le site Nova.IO est édité par :\n\nAlexandre D., micro-entrepreneur en cours d'immatriculation\nSiège social : Île-de-France\nEmail : nova.iocontact@gmail.com\n\nDirecteur de la publication : Alexandre D.`,
      },
      {
        heading: 'Hébergement',
        body: `Le site est hébergé par :\n\nVercel Inc.\n340 Pine Street, Suite 1601\nSan Francisco, CA 94104 — États-Unis\nSite : vercel.com`,
      },
      {
        heading: 'Propriété intellectuelle',
        body: `L'ensemble du contenu de ce site (textes, visuels, logo, structure) est la propriété exclusive de Nova.IO. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.`,
      },
      {
        heading: 'Responsabilité',
        body: `Nova.IO s'efforce de maintenir les informations de ce site à jour et exactes. Nova.IO ne saurait être tenu responsable des erreurs, omissions ou résultats obtenus suite à une mauvaise utilisation des informations publiées.`,
      },
    ],
  },
  cgv: {
    title: 'Conditions Générales de Vente',
    sections: [
      {
        heading: 'Article 1 — Objet',
        body: `Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre Nova.IO (Alexandre D., micro-entrepreneur, Île-de-France, nova.iocontact@gmail.com) et tout client professionnel passant commande d'une prestation de création de site web.\n\nToute commande implique l'acceptation pleine et entière des présentes CGV.`,
      },
      {
        heading: 'Article 2 — Prestations proposées',
        body: `Nova.IO propose deux offres principales :\n\n• Nova Menu (700 € TTC) : site web de commande en ligne pour restaurants, incluant menu digital, design sur mesure, responsive mobile & desktop, référencement local (SEO), hébergement et nom de domaine la première année, 2 tours de corrections.\n\n• Nova Vitrine (450 € TTC) : site vitrine 5 pages pour artisans, commerçants et TPE, incluant design sur mesure, formulaire de contact, responsive mobile & desktop, référencement local (SEO), hébergement et nom de domaine la première année, 2 tours de corrections.\n\nDes prestations complémentaires peuvent être devisées sur demande (maintenance mensuelle, refonte contenu, SEO avancé).`,
      },
      {
        heading: 'Article 3 — Tarifs et modalités de paiement',
        body: `Les tarifs sont indiqués en euros TTC. Nova.IO, en tant que micro-entrepreneur non assujetti à la TVA, applique la mention : "TVA non applicable — article 293 B du CGI".\n\nLe règlement s'effectue en deux versements :\n• 50 % à la signature de la lettre de mission (acompte)\n• 50 % à la livraison du site\n\nLes moyens de paiement acceptés sont : virement bancaire, PayPal, Lydia/Sumeria. L'acompte est dû avant tout démarrage des travaux.`,
      },
      {
        heading: 'Article 4 — Délais de livraison',
        body: `Le délai de livraison standard est de 14 jours calendaires à compter de la réception de l'acompte et des éléments nécessaires à la réalisation (textes, photos, logo, accès).\n\nCe délai est donné à titre indicatif. Tout retard de transmission des éléments par le client entraîne automatiquement un report équivalent du délai de livraison. Nova.IO ne saurait être tenu responsable des retards causés par le client.`,
      },
      {
        heading: 'Article 5 — Obligations du client',
        body: `Le client s'engage à :\n• Fournir en temps utile tous les éléments nécessaires à la réalisation (textes, visuels, logo, accès hébergeur/domaine si existant)\n• Désigner un interlocuteur unique pour les échanges et validations\n• Formuler ses retours de manière précise et complète dans le délai de 7 jours suivant la livraison de chaque version\n\nAu-delà de 2 tours de corrections inclus, toute modification supplémentaire fera l'objet d'un devis complémentaire.`,
      },
      {
        heading: 'Article 6 — Propriété intellectuelle',
        body: `Nova.IO cède au client, à la livraison complète et après règlement intégral, les droits d'utilisation sur le site livré (mise en ligne, modification ultérieure, reproduction).\n\nNova.IO se réserve le droit de mentionner la réalisation dans son book de références (nom du client, capture d'écran, URL), sauf refus explicite du client formulé par écrit.`,
      },
      {
        heading: 'Article 7 — Droit de rétractation',
        body: `Conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux prestations de services pleinement exécutées avant la fin du délai de rétractation, ni aux contenus numériques personnalisés.\n\nLes prestations Nova.IO étant des créations sur mesure débutant dès versement de l'acompte, aucun remboursement de l'acompte ne pourra être réclamé une fois les travaux engagés.`,
      },
      {
        heading: 'Article 8 — Responsabilité',
        body: `Nova.IO s'engage à apporter tout le soin et la diligence nécessaires à la bonne réalisation des prestations commandées. Nova.IO n'est tenu qu'à une obligation de moyens.\n\nNova.IO ne saurait être tenu responsable des préjudices indirects (perte de chiffre d'affaires, perte de clientèle) liés à l'utilisation ou à l'indisponibilité du site livré. La responsabilité de Nova.IO est en tout état de cause limitée au montant de la prestation facturée.`,
      },
      {
        heading: 'Article 9 — Résiliation',
        body: `En cas de manquement grave de l'une ou l'autre des parties à ses obligations, le contrat pourra être résilié par lettre recommandée avec accusé de réception, après mise en demeure restée sans effet pendant 15 jours.\n\nEn cas de résiliation à l'initiative du client après démarrage des travaux, l'acompte versé reste acquis à Nova.IO en compensation du travail réalisé.`,
      },
      {
        heading: 'Article 10 — Droit applicable et litiges',
        body: `Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut d'accord, le litige sera porté devant les tribunaux compétents du ressort d'Île-de-France.\n\nMise à jour : mars 2026.`,
      },
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      {
        heading: 'Données collectées',
        body: `Lors de l'utilisation du formulaire de contact, les données suivantes sont collectées :\n- Prénom\n- Nom de l'établissement\n- Adresse email\n- Numéro de téléphone (facultatif)\n- Message\n\nCes données sont utilisées exclusivement pour répondre à votre demande.`,
      },
      {
        heading: 'Conservation des données',
        body: `Les données transmises via le formulaire de contact sont conservées le temps nécessaire au traitement de votre demande, et au maximum 3 ans conformément aux obligations légales.`,
      },
      {
        heading: 'Partage des données',
        body: `Vos données ne sont ni vendues, ni louées, ni transmises à des tiers. Elles transitent via le service EmailJS (emailjs.com) pour l'acheminement du message.`,
      },
      {
        heading: 'Vos droits (RGPD)',
        body: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données. Pour exercer ces droits : nova.iocontact@gmail.com`,
      },
      {
        heading: 'Cookies',
        body: `Ce site utilise Google Analytics 4 (Google LLC) afin de mesurer l'audience et améliorer nos services. À ce titre, des cookies de mesure d'audience sont déposés sur votre terminal lors de votre visite. Les données collectées (pages visitées, durée de session, pays, type d'appareil) sont anonymisées et transmises à Google. Aucun cookie publicitaire n'est utilisé. Conformément au RGPD, vous pouvez refuser ces cookies en installant le module de désactivation Google Analytics disponible sur : tools.google.com/dlpage/gaoptout. Pour en savoir plus sur la politique de confidentialité de Google : policies.google.com/privacy.`,
      },
    ],
  },
}

function LegalModal({ type, onClose }) {
  const content = LEGAL_CONTENT[type]
  if (!content) return null

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-xl font-black text-gray-900 mb-7">{content.title}</h2>

          <div className="flex flex-col gap-6">
            {content.sections.map(s => (
              <div key={s.heading}>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-violet-600 mb-2">{s.heading}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11px] text-gray-400">Dernière mise à jour : mars 2026</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  useLenis()
  const [legalModal, setLegalModal] = useState(null)

  return (
    <div className="min-h-screen font-sans antialiased">
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ROICalculator />
        <Results />
        <Features />
        <Process />
        <Portfolio />
        <Compare />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Calendly />
        <FinalCTA />
        <Contact />
      </main>
      <Zones />
      <Footer onLegal={setLegalModal} />
      <WhatsAppButton />
      <SocialProofToast />
      <ExitPopup />
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  )
}
