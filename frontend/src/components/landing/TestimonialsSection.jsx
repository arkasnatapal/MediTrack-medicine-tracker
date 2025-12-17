import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Caregiver",
    quote:
      "MediTrack has been a lifesaver for managing my mother's complex medication schedule. The AI reminders are spot on.",
    initials: "SJ",
    color: "bg-pink-500",
  },
  {
    name: "David Chen",
    role: "Medical Student",
    quote:
      "I use it to track my own supplements and study the drug interaction feature. It's incredibly accurate and easy to use.",
    initials: "DC",
    color: "bg-blue-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Mother of 2",
    quote:
      "Finally, an app that lets me manage my kids' antibiotics and vitamins in one place. The family profile feature is genius.",
    initials: "ER",
    color: "bg-amber-500",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Loved by thousands
          </h2>
          <p className="text-slate-400">
            See what our community has to say about MediTrack.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative"
            >
              <Quote className="absolute top-8 right-8 w-8 h-8 text-white/10" />
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                "{testimonial.quote}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
