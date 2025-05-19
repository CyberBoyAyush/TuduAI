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
  SparklesIcon
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero section */}
      <motion.section 
        className="text-center py-16 md:py-24 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Abstract background shape */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-gradient-to-br from-primary-100 to-violet-100 dark:from-primary-900/20 dark:to-violet-900/10 rounded-full blur-3xl opacity-40 dark:opacity-30 -z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SparklesIcon className="w-12 h-12 mx-auto text-primary-500 mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary-500 to-violet-600 bg-clip-text text-transparent">
              TuduAI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 mb-6">
            Plan less. Do more.
          </p>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-10">
            The task manager that understands your language and organizes your life with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/register">
              <motion.button
                className="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>Start for free</span>
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </motion.button>
            </Link>
            
            <Link to="/login">
              <motion.button
                className="px-8 py-3.5 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl shadow-md border border-gray-100 dark:border-neutral-700"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Login
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.section>
      
      {/* Features section */}
      <motion.section 
        className="py-16 my-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white"
          variants={itemVariants}
        >
          Simplicity meets <span className="text-primary-500">intelligence</span>
        </motion.h2>
        
        <div className="grid md:grid-cols-3 gap-8 px-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-2xl transition-all hover:shadow-md dark:hover:shadow-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800/50 border border-transparent hover:border-gray-100 dark:hover:border-neutral-700"
              variants={itemVariants}
            >
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-500 dark:text-primary-400 mb-5">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-800 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
      
      {/* Call to action */}
      <motion.section 
        className="py-20 text-center relative overflow-hidden rounded-2xl my-10 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900/80 dark:to-neutral-800/80 border border-gray-100 dark:border-neutral-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="absolute -right-10 top-0 w-40 h-40 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-60 dark:opacity-30"></div>
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-violet-100 dark:bg-violet-900/20 rounded-full blur-3xl opacity-60 dark:opacity-30"></div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white relative z-10">
          Transform your productivity today
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8 relative z-10">
          Join thousands who are getting more done with less mental overhead
        </p>
        
        <Link to="/register">
          <motion.button
            className="group px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 flex items-center mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Get Started — It's Free</span>
            <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </motion.section>
    </div>
  )
}
