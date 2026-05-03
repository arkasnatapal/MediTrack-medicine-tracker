import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Utensils, FolderOpen, Bell, Users, Activity, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "AI Health Assistant",
    description: "Your 24/7 personal health companion. Ask about drug interactions or get personalized wellness advice instantly.",
    icon: <Bot />,
    image: "/feature-ai.png",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    title: "Smart Food Tracking",
    description: "Track your meals and get AI-powered insights on how your diet affects your medication efficacy.",
    icon: <Utensils />,
    image: "/feature-food.png",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    title: "Intelligent Folders",
    description: "Automatically organize your medicines into smart categories like 'Heart Health' or 'Vitamins'.",
    icon: <FolderOpen />,
    image: "/feature-folders.png",
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    title: "Family Care Connect",
    description: "Manage medications for your entire family, including children and elderly parents, from one account.",
    icon: <Users />,
    image: "/feature-family.png",
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    title: "Health Analytics",
    description: "Visualize your adherence trends and health improvements with beautiful, easy-to-understand charts.",
    icon: <Activity />,
    image: "/feature-analytics.png",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-600",
  }
];

const HorizontalScrollFeatures = () => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const wrapper = wrapperRef.current;
      const section = sectionRef.current;
      
      const scrollWidth = wrapper.scrollWidth;
      const amountToScroll = scrollWidth - window.innerWidth;

      gsap.to(wrapper, {
        x: -amountToScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${amountToScroll}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // Parallax background elements
      gsap.to(".bg-circle", {
        x: 100,
        y: -50,
        scrollTrigger: {
          trigger: section,
          scrub: true,
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#F9FBFF] h-screen md:h-screen flex items-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="bg-circle absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-[120px] opacity-60" />
        <div className="bg-circle absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[120px] opacity-40" />
      </div>

      <div ref={wrapperRef} className="flex h-full items-center px-6 md:pl-32 md:pr-32 whitespace-nowrap">
        
        {/* Intro Section */}
        <div className="min-w-[90vw] md:min-w-[600px] flex flex-col justify-center mr-12 md:mr-40 py-20 md:py-0 whitespace-normal">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={16} />
            </div>
            <span className="text-emerald-600 font-bold tracking-widest text-[10px] md:text-xs uppercase">Premium Features</span>
          </div>
          <h2 className="text-4xl md:text-8xl font-black text-slate-900 leading-[1] md:leading-[0.9] tracking-tight mb-6 md:mb-8">
            Intelligent <br className="hidden md:block" />
            Health tools <br className="hidden md:block" />
            <span className="text-slate-300">for better lives.</span>
          </h2>
          <p className="text-lg md:text-2xl text-slate-500 font-light leading-relaxed max-w-xl">
            Swipe or scroll to explore our ecosystem of AI-driven tools designed to simplify your medical routine.
          </p>
        </div>

        {/* Feature Cards Loop */}
        <div className="flex gap-8 md:gap-16 items-center">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative w-[85vw] md:w-[500px] h-[550px] md:h-[650px] p-10 md:p-14 bg-white/60 backdrop-blur-2xl border border-slate-200/50 rounded-[3rem] md:rounded-[4rem] flex flex-col justify-between shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_48px_80px_-15px_rgba(0,0,0,0.12)] hover:border-emerald-300 transition-all duration-700 whitespace-normal overflow-hidden"
            >
              {/* Image Background with Gradient Blur */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000 opacity-60 blur-[1px] grayscale-[20%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
              </div>

              {/* Card Background Glow */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${feature.lightColor} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${feature.color} flex items-center justify-center text-white shadow-xl shadow-${feature.color}/20 mb-10 group-hover:scale-110 transition-transform duration-500`}>
                  {React.cloneElement(feature.icon, { size: 32 })}
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                  {feature.title}
                </h3>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="relative z-10 pt-10">
                <div className="flex items-center justify-between">
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ending Section - Call to Action */}
        <div className="min-w-[90vw] md:min-w-[600px] flex flex-col items-center justify-center ml-12 md:ml-40 py-8 md:py-0 whitespace-normal text-center">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl mb-10 md:mb-8 animate-bounce">
            <ArrowRight size={window.innerWidth > 768 ? 40 : 28} />
          </div>
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 md:mb-10 leading-[0.9]">
            Explore<br className="hidden md:block" />
            <span className="text-emerald-500">MORE</span>
          </h2>
          <Link to="/signup">
            <button className="px-10 py-4 md:px-12 md:py-5 bg-slate-900 text-white rounded-full font-bold text-base md:text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
              Join Now
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
