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
  ArrowRightIcon
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
      icon: <BoltIcon className="w-5 h-5" />,
      title: 'AI-Powered Task Parsing',
      description: 'Type tasks in natural language and let TuduAI understand the details.'
    },
    {
      icon: <ClockIcon className="w-5 h-5" />,
      title: 'Smart Due Dates',
      description: 'Automatically organize tasks by today, upcoming, and future due dates.'
    },
    {
      icon: <CheckCircleIcon className="w-5 h-5" />,
      title: 'Simple Task Management',
      description: 'Create, organize, and complete tasks with intuitive controls.'
    }
  ]
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero section */}
      <motion.section 
        className="text-center py-12 md:py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          <span className="bg-gradient-to-r from-primary-500 to-violet-600 bg-clip-text text-transparent">
            TuduAI
          </span> 
          <br className="md:hidden" />
          <span className="block mt-2">Smart Task Management</span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
          The intelligent task manager that understands your schedule, powered by AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <motion.button
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-lg shadow-primary-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </Link>
          
          <Link to="/login">
            <motion.button
              className="px-8 py-3 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg shadow-lg shadow-gray-200/30 dark:shadow-neutral-900/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
          </Link>
        </div>
      </motion.section>
      
      {/* Features section */}
      <motion.section 
        className="py-12 bg-gray-50 dark:bg-neutral-800/30 rounded-xl my-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Organize your life with <span className="text-primary-500">intelligence</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 px-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md"
              variants={itemVariants}
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
      
      {/* Call to action */}
      <motion.section 
        className="py-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Ready to transform your productivity?
        </h2>
        
        <Link to="/register">
          <motion.button
            className="group px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-lg shadow-primary-500/20 flex items-center mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Get Started Today</span>
            <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </motion.section>
    </div>
  )
}
