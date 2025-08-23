import Header from "@/components/Header";
import {
  Brain,
  GraduationCap,
  Award,
  Users,
  Lightbulb,
  Code,
} from "lucide-react";
import { useEffect, useState } from "react";

const About = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for subtle parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${
              mousePosition.y * 0.025
            }px)`,
          }}
        ></div>
        <div
          className="absolute top-1/2 left-10 w-28 h-28 bg-gradient-to-br from-pink-500/8 to-purple-500/8 rounded-full blur-xl"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${
              mousePosition.y * -0.02
            }px)`,
          }}
        ></div>
      </div>

      <Header />
      <div className="pt-16 relative z-10">
        <section className="py-24">
          <div className="container mx-auto px-6">
            {/* Enhanced Header */}
            <div className="text-center mb-20">
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/25">
                  <Brain className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  About Me
                </span>
              </h1>
            </div>

            <div className="max-w-6xl mx-auto">
              {/* Enhanced Profile Section */}
              <div className="bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-3xl border border-border/50 p-8 md:p-12 mb-16 shadow-2xl">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Carlos Francisco González Rivera
                    </span>
                  </h2>
                  <div className="text-xl md:text-2xl font-semibold mb-4 text-foreground/80">
                    M.E.C.E., B.S.B.M.E.
                  </div>
                  <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                    <span className="font-semibold text-cyan-400">
                      Neuroengineer
                    </span>
                    <span className="mx-4 text-foreground/40">||</span>
                    <span className="font-semibold text-purple-400">
                      Data Scientist
                    </span>
                    <span className="mx-4 text-foreground/40">||</span>
                    <span className="font-semibold text-pink-400">
                      Innovator
                    </span>
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <p className="text-lg md:text-xl text-foreground/80 mb-8 leading-relaxed">
                    Carlos Francisco González Rivera is a dynamic and versatile{" "}
                    <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Data Scientist
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Biomedical Engineer
                    </span>{" "}
                    whose work bridges the cutting edges of healthcare
                    innovation, national security, neuromorphic computing, and
                    artificial intelligence. With a solid foundation in
                    developing machine learning models, anomaly detection
                    systems, and computational tools, Carlos has a proven track
                    record in both startup environments and large-scale research
                    organizations.
                  </p>
                  <p className="text-lg md:text-xl text-foreground/80 mb-12 leading-relaxed">
                    His expertise spans from{" "}
                    <span className="font-semibold text-purple-400">
                      biomedical device innovation
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-cyan-400">
                      data-driven solutions
                    </span>{" "}
                    that enhance human performance and national security
                    infrastructure.
                  </p>
                </div>
              </div>

              {/* Career Highlights Section */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/25">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Career Highlights & Contributions
                    </span>
                  </h3>
                </div>

                <div className="grid md:grid-cols-1 gap-8 max-w-5xl mx-auto">
                  <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-xl">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-3"></div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 text-purple-300">
                            Real‑time Learning with Neuromorphic Systems
                          </h4>
                          <p className="text-foreground/70 leading-relaxed">
                            Collaborated with Intel, LANL, and Drexel University
                            to develop Spiking Neural Networks (SNNs) for
                            real-time data processing using Intel's Loihi
                            neuromorphic chip, resulting in adaptive ML models
                            published in ICONS 2022.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mt-3"></div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 text-cyan-300">
                            Persistent DyNAMICS
                          </h4>
                          <p className="text-foreground/70 leading-relaxed">
                            Designed and implemented unsupervised ML models for
                            anomaly detection in nuclear facility monitoring
                            systems—leveraging SHAP, LIME, and timestamp
                            rolling—presented at the 2023 INMM & ESARDA Joint
                            Annual Meeting.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mt-3"></div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 text-pink-300">
                            Image Processing for Synthetic Biology
                          </h4>
                          <p className="text-foreground/70 leading-relaxed">
                            Developed image segmentation techniques using
                            OpenCV, DINO, SAM, Grounding DINO, and Grounded-SAM
                            to analyze microbial images for PNNL's PerCon SFA
                            Project.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/25">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Education
                    </span>
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 shadow-xl">
                    <h4 className="text-xl font-bold mb-3 text-purple-300">
                      Master of Engineering
                    </h4>
                    <p className="text-lg font-semibold mb-2 text-foreground/80">
                      Electrical and Computer Engineering
                    </p>
                    <p className="text-foreground/60">Rice University</p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-cyan-500/20 p-8 shadow-xl">
                    <h4 className="text-xl font-bold mb-3 text-cyan-300">
                      Bachelor of Science
                    </h4>
                    <p className="text-lg font-semibold mb-2 text-foreground/80">
                      Biomedical Engineering
                    </p>
                    <p className="text-foreground/60">
                      Polytechnic University of Puerto Rico
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Skills Section */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl shadow-lg shadow-pink-500/25">
                      <Code className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Technical Skills
                    </span>
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-xl">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-purple-300">
                          Machine Learning & AI
                        </h4>
                        <p className="text-foreground/70">
                          PyTorch, TensorFlow, Scikit-learn, Keras, Huggingface
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-cyan-300">
                          Neuromorphic Computing & SNNs
                        </h4>
                        <p className="text-foreground/70">
                          Intel Loihi, LCAs, DVS
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-pink-300">
                          Data Science & Feature Engineering
                        </h4>
                        <p className="text-foreground/70">
                          SHAP, LIME, anomaly detection
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-purple-300">
                          Computer Vision
                        </h4>
                        <p className="text-foreground/70">
                          OpenCV, DINO, Grounding DINO, SAM
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-cyan-300">
                          Signal Processing
                        </h4>
                        <p className="text-foreground/70">
                          FFT, wavelets, time-series analysis
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-pink-300">
                          Data Handling
                        </h4>
                        <p className="text-foreground/70">
                          Pandas, NumPy, SciPy, HEOM
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-purple-300">
                          Development Tools
                        </h4>
                        <p className="text-foreground/70">
                          Git, Docker, Jupyter, DVC, SLURM, SSH
                        </p>
                      </div>
                       <div>
                        <h4 className="text-lg font-semibold mb-3 text-cyan-300">
                          Web Development
                        </h4>
                        <p className="text-foreground/70">
                          React, Next.js, Vite, Node.js, Express.js, HTML/CSS, JavaScript
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching & Leadership Section */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-2xl shadow-lg shadow-cyan-500/25">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Teaching & Leadership
                    </span>
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mt-3"></div>
                      <p className="text-foreground/70 leading-relaxed">
                        Taught "Python for Data Science" through PNNL's BOLTS
                        program
                      </p>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-3"></div>
                      <p className="text-foreground/70 leading-relaxed">
                        Lead TA for the Python tutorials and office hours in
                        Rice's "Introduction to Neuroengineering" course
                      </p>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-pink-400 to-cyan-400 rounded-full mt-3"></div>
                      <p className="text-foreground/70 leading-relaxed">
                        Rice University TA, Software Lead for Neurotech@Rice,
                        and sponsor for Rice's D2K Lab Hackathon
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Research Interests */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-pink-600 to-cyan-600 rounded-2xl shadow-lg shadow-pink-500/25">
                      <Lightbulb className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                      Future Research Interests
                    </span>
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-xl max-w-4xl mx-auto">
                  <p className="text-lg md:text-xl text-foreground/80 leading-relaxed text-center">
                    Carlos is driven by{" "}
                    <span className="font-semibold text-purple-400">
                      predictive modeling's potential
                    </span>{" "}
                    in early detection of physiological abnormalities,{" "}
                    <span className="font-semibold text-cyan-400">
                      Explainable AI (XAI)
                    </span>{" "}
                    in real-time adaptive systems, and integrating{" "}
                    <span className="font-semibold text-pink-400">
                      biomimicry, advanced sensors, and neuromorphic processors
                    </span>{" "}
                    to advance human‑machine interfaces, digital healthcare, and
                    national security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
