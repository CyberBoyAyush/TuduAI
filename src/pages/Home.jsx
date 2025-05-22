/**
 * File: Home.jsx
 * Purpose: Public landing page, redirects to /todo if user is logged in
 */
import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  CheckCircleIcon, 
  BoltIcon, 
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  // Redirect to todo if user is logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/todo')
    }
  }, [currentUser, navigate])
  
  const features = [
    {
      icon: <BoltIcon className="w-6 h-6" />,
      title: 'Natural Language Input',
      description: 'Just type what you need to do. TuduAI understands and organizes it for you.'
    },
    {
      icon: <ClockIcon className="w-6 h-6" />,
      title: 'Intelligent Scheduling',
      description: 'Focus on today\'s priorities while we smartly organize what\'s coming next.'
    },
    {
      icon: <CheckCircleIcon className="w-6 h-6" />,
      title: 'Effortless Management',
      description: 'Plan less, do more with intuitive task creation and completion.'
    }
  ]
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }
  
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* Hero section */}
      <motion.section 
        className="flex flex-col items-center justify-center min-h-[85vh] text-center py-8 md:py-0 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Minimal background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#f2f0e3]/70 dark:bg-[#202020]/70 rounded-full blur-3xl opacity-60 dark:opacity-40 -z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center mt-[-5vh]"
        >
          {/* Logo container with minimalist design */}
          <motion.div 
            className="relative mb-3"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
          >
            <div className="flex items-center justify-center">
              <motion.div 
                className="relative"
                whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#f76f52] dark:bg-[#f76f52] flex items-center justify-center shadow-md mb-0 relative">
                  <motion.span 
                    className="text-[#f2f0e3] dark:text-[#202020] text-3xl md:text-4xl font-bold"
                    animate={{ 
                      opacity: [1, 0.8, 1],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    T
                  </motion.span>
                  
                  {/* Added productivity icons */}
                  <motion.div 
                    className="absolute -top-2 -right-2 bg-[#f2f0e3] dark:bg-[#202020] rounded-full p-1 border-2 border-[#f76f52] shadow-sm"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4 md:w-5 md:h-5 text-[#f76f52]" />
                  </motion.div>
                  
                  <motion.div 
                    className="absolute -bottom-2 -left-2 bg-[#f2f0e3] dark:bg-[#202020] rounded-full p-1 border-2 border-[#f76f52] shadow-sm"
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
                  >
                    <CheckBadgeIcon className="w-4 h-4 md:w-5 md:h-5 text-[#f76f52]" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#202020] dark:text-[#f2f0e3] mb-2 tracking-tighter">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              TuduAI
            </motion.span>
          </h1>
          
          <p className="text-xl md:text-2xl font-medium text-[#202020] dark:text-[#f2f0e3] mb-2 tracking-tight">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              Plan less. <span className="text-[#f76f52]">Do more.</span>
            </motion.span>
          </p>
          
          <motion.p 
            className="text-sm md:text-base text-[#3a3a3a] dark:text-[#d1cfbf] max-w-xl mx-auto mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            The intelligent task manager that understands your language and transforms how you organize your life.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-1">
            <Link to="/register">
              <motion.button
                className="px-6 py-2.5 bg-[#f76f52] text-[#f2f0e3] dark:text-[#202020] font-medium rounded-md flex items-center justify-center w-full sm:w-auto border border-transparent hover:bg-[#e55e41] dark:hover:bg-[#ff8b73] transition-colors"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Start for free</span>
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </motion.button>
            </Link>
            
            <Link to="/login">
              <motion.button
                className="px-6 py-2.5 bg-[#f2f0e3] dark:bg-[#202020] text-[#202020] dark:text-[#f2f0e3] font-medium rounded-md border border-[#202020] dark:border-[#f2f0e3] hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] transition-colors"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                Login
              </motion.button>
            </Link>
          </div>
          
          {/* Added decorative elements */}
          <motion.div
            className="absolute -bottom-16 -right-16 w-32 h-32 md:w-40 md:h-40 opacity-20 -z-10"
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 0.2, rotate: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <SparklesIcon className="w-full h-full text-[#f76f52]" />
          </motion.div>
          
          <motion.div
            className="absolute -bottom-16 -left-16 w-32 h-32 md:w-40 md:h-40 opacity-20 -z-10"
            initial={{ opacity: 0, rotate: 10 }}
            animate={{ opacity: 0.2, rotate: 0 }}
            transition={{ duration: 1, delay: 1.3 }}
          >
            <CheckCircleIcon className="w-full h-full text-[#202020] dark:text-[#f2f0e3]" />
          </motion.div>
        </motion.div>
      </motion.section>
      
      {/* Features section */}
      <motion.section 
        className="py-12 my-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-xl md:text-2xl font-bold text-center mb-12 text-[#202020] dark:text-[#f2f0e3] tracking-tight"
          variants={itemVariants}
        >
          Simplicity meets <span className="border-b-2 border-[#f76f52] pb-1">intelligence</span>
        </motion.h2>
        
        <div className="grid md:grid-cols-3 gap-6 px-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-5 rounded-md transition-all hover:bg-[#e8e6d9] dark:hover:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#2a2a2a] hover:shadow-md"
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="w-9 h-9 bg-[#f2f0e3] dark:bg-[#2a2a2a] rounded-md flex items-center justify-center text-[#f76f52] mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-base mb-2 text-[#202020] dark:text-[#f2f0e3]">
                {feature.title}
              </h3>
              <p className="text-[#3a3a3a] dark:text-[#d1cfbf] leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
      
      {/* Call to action */}
      <motion.section 
        className="py-14 text-center relative overflow-hidden rounded-md my-12 bg-[#e8e6d9] dark:bg-[#2a2a2a] border border-[#d8d6cf] dark:border-[#3a3a3a]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#202020] dark:text-[#f2f0e3] tracking-tight relative z-10">
            Transform your productivity today
          </h2>
          
          <p className="text-[#3a3a3a] dark:text-[#d1cfbf] mb-6 relative z-10 text-sm">
            Join thousands who are getting more done with less mental overhead
          </p>
          
          <Link to="/register">
            <motion.button
              className="group px-6 py-2.5 bg-[#f76f52] text-[#f2f0e3] dark:text-[#202020] font-medium rounded-md flex items-center mx-auto hover:bg-[#e55e41] dark:hover:bg-[#ff8b73] transition-colors"
              whileHover={{ scale: 1.02, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Get Started — It's Free</span>
              <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          
          {/* Added decorative element */}
          <motion.div 
            className="absolute -bottom-8 -right-8 w-20 h-20 opacity-10" 
            animate={{ 
              rotate: [0, 360],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <BoltIcon className="w-full h-full text-[#f76f52]" />
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
