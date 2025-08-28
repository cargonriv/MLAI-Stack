import Header from "@/components/Header";
import { ExternalLink, Github, Calendar, Tag, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Projects = () => {
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

  const projects = [
    {
      title: "Web3 Hackathon (1st Place)",
      description:
        "Fast, user-friendly tool built to explore Ethereum's vast NFT space by allowing users to enter an Ethereum-compatible address (whether an externally owned account or an NFT collection) to quickly retrieve transaction stats for ERC-721s and ETH with future support for ERC-20s.",
      technologies: [
        "Alchemy API",
        "Chainlink",
        "Firebase",
        "HTML",
        "CSS",
        "React",
        "TypeScript",
        "Solidity",
      ],
      status: "Completed",
      link: "https://www.devpost.com/software/spynft",
      github: "https://www.github.com/cargonriv/spynft",
    },
    {
      title: '"Metaverso" Hackathon (1st Place)',
      description:
        "Creative generative art project that transforms data from hundreds of individuals who died of COVID-19 in Puerto Rico into unique NFT artwork, serving as a poignant digital homage to their lives",
      technologies: [
        "p5.js",
        "paper.js",
        "HTML",
        "CSS",
        "JavaScript",
        "Solidity",
      ],
      status: "Completed",
      link: "https://www.devpost.com/software/data-life-puerto-rico",
      github: "https://www.github.com/germs/Data-Life-PR",
      featured: true,
    },
    {
      title: "Baby Boutique",
      description:
        "A modern, responsive e-commerce store for baby clothes and accessories. It includes features for both customers (browsing, search, cart, Stripe/Square checkout) and administrators (product and order management, role-based access).",
      technologies: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "TanStack Query",
        "React Router DOM",
        "Vite",
        "Supabase",
        "Stripe",
        "Square",
        "PLpgSQL",
      ],
      status: "Completed",
      // link: "https://github.com/cargonriv/baby-boutique",
      github: "https://github.com/cargonriv/baby-boutique",
    },

    {
      title: "Grounded SAM Object Detection",
      description:
        "Implemented and optimized the Grounded SAM model for enhanced object detection and segmentation tasks, like colonies in multi-well plates. This project focuses on combining vision transformers with grounding capabilities.",
      technologies: [
        "NumPy",
        "SciPy",
        "OpenCV",
        "PyTorch",
        "TorchVision",
        "Scikit-image",
        "MatPlotLib",
        "Semgent-Anything Model",
        "Transformers",
        "Segmentation",
        "ONNX Runtime Web",
      ],
      status: "Ongoing",
      featured: true,
      link: "/#/blog/segmenting-the-invisible",
    },
    {
      title: "Linked Dictionary Learning with Accumulator Neurons",
      description:
        "Implementation of Linked Locally Competitive Algorithm (LCA) dictionaries for sparse coding. It allows for the flexible construction of single or multi-layer convolutional sparse coding networks to operate on linked datasets for behavior inference. The project currently supports 1D, 2D, and 3D convolutional LCA layers.",
      technologies: [
        "Neural Networks",
        "Neuromorphic Computing",
        "Sparse Approximation",
        "NumPy",
        "Pandas",
        "PyTorch",
        "TorchVision",
        "TorchAudio",
        "MatPlotLib",
        "Seaborn",
      ],
      status: "Completed",
      link: "/#/blog/cracking-the-minds-code",
      github: "https://www.github.com/cargonriv/linked-lca",
    },
    {
      title: "IndurAITb: Tuberculosis Skin Test (TST) Interpretations with AI",
      description:
        "Low-cost, AI-assisted diagnostic tool to help detect and monitor tuberculosis in underserved communities. It integrates ML with simple medical inputs to provide faster, more accessible TB screening outside traditional clinical settings.",
      technologies: [
        "NumPy",
        "Pandas",
        "PyTorch",
        "FastAPI",
        "OpenCV",
        "Grounding DINO",
        "Grounded SAM",
        "Image Segmentation",
        "ONNX Runtime",
        "ffmpeg",
        "React",
        "TypeScript",
        "Tailwind CSS",
      ],
      status: "Completed",
      github: "https://github.com/jmoreto/Tuberculosis-Skin-Test",
      // featured: true,
    },
    {
      title: "ML Recognition of Cardio-Respiratory Signals that Predict SIDS",
      // title: "SIDS Prediction System",
      description:
        "Developed a ML model to predict Sudden Infant Death Syndrome (SIDS) using healthcare data. This project combined deep learning techniques with medical domain expertise to create a diagnostic tool.",
      technologies: [
        "NumPy",
        "SciPy",
        "Pandas",
        "Keras",
        "TensorFlow",
        "Scikit-learn",
        "MatPlotLib",
        "Seaborn",
        "OpenCV",
        "NeuroKit2",
        "PyWavelets",
        "Fourier Transforms",
        "Convolutional Neural Networks",
        "Dimensionality Reduction Analysis (UMAP)",
        "Feature Engineering/Selection",
        "Time Series Forecasting",
      ],
      status: "Completed",
      featured: true,
      link: "/#/blog/automating-healthcare-diagnostics",
    },
    {
      title: "Medical Image-Based ML Diagnostics for Cardiovascular Diseases",
      description:
        "This project focuses on developing and validating an AI image-based diagnostic tool for Heart Failure (HF) using estimated conventional imaging indices such as ventricular volumes and ejection fraction from raw MRI images. The study successfully built a ML tool using decision trees for image-based HF diagnosis, achieving 100% accuracy on tested patients. It involved accurate and precise cardiac segmentation and quantification of key left ventricle functional indices from CMR.",
      technologies: [
        "Cardiac Segmentation",
        "Decision Trees",
        "Random Forests",
        "MRI",
        "CT",
        "Ultrasound",
        "Scikit-image",
        "Scikit-learn",
        "Pydicom",
        "NumPy",
        "Pandas",
        "MatPlotLib",
      ],
      status: "Completed",
      featured: true,
      link: "https://drive.google.com/1XVGNScbfIhrXaluHx1-AEa7i9edQhJ2m/view",
      github: "https://github.com/cargonriv/cardiac-imaging-AI",
    },
    {
      title: "T-VAD: Telemonitoring Ventricular Assist Device",
      description:
        "Designed and implemented a telemonitoring subsystem for a Ventricular Assist Device (VAD) prototype aimed at supporting patients with advanced heart failure. Led the integration of embedded programming, physiological signal acquisition, and wireless communication to enable real-time remote monitoring. Collaborated across biomedical, electrical, and mechanical domains to ensure accurate hemodynamic sensing, device reliability, and clinical usability. My contributions spanned programming, data handling, systems integration, and interdisciplinary coordination, resulting in a validated proof-of-concept.",
      technologies: [
        "Embedded Systems",
        "Wireless Telemetry",
        "Physiological Signal Processing",
        "Python",
        "C++",
        "MATLAB",
        "Arduino",
        "Biomedical Engineering",
        "Cardiovascular Healthcare",
      ],
      status: "Completed",
      featured: true,
      link: "https://www.instagram.com/p/CV5_oPLl6qX",
      // github: "", // No direct GitHub link found
    },
    {
      title: "Wedding Website Platform",
      description:
        "Full-stack web application for couples to create and manage their wedding websites, featuring guest management and RSVP functionality.",
      technologies: [
        "EJS",
        "React",
        "TypeScript",
        "Firebase",
        "Express.js",
        "MongoDB",
        "HTML",
        "CSS",
        "PHP",
      ],
      status: "Ongoing",
      link: "https://boricua.wedding",
      github: "https://github.com/cargonriv/boricua.wedding",
      // featured: true,
    },
    {
      title: "Data Science Tutorials",
      description:
        "Comprehensive collection of data science resources, covering Python programming, ML fundamentals, and practical applications.",
      technologies: [
        "Python",
        "NumPy",
        "Pandas",
        "MatPlotLib",
        "Education",
        "Data Science",
        "Tutorials",
      ],
      status: "Ongoing",
      link: "/#/blog/data-science-tutorials",
    },
    {
      title: "PacWarrior",
      description:
        "A Pac-Man-like war game leveraging readily known AI concepts like different search approaches, hidden markov models, genetic algorithms, and others.",
      technologies: ["C", "Python", "NumPy", "Tcl", "Makefile", "C++"],
      status: "Completed",
      // link: "https://github.com/cargonriv/PacWarrior",
      github: "https://github.com/cargonriv/PacWarrior",
    },
    {
      title: "BoostGM",
      description:
        "ML predictions for future performances of pro NBA players. Currently extending to NFL and MLB.",
      technologies: [
        "Scikit-learn",
        "NumPy",
        "Pandas",
        "requests",
        "BeautifulSoup",
        "Shell",
      ],
      status: "Ongoing",
      // link: "https://github.com/cargonriv/BoostGM",
      github: "https://github.com/cargonriv/BoostGM",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-500/8 to-pink-500/8 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-cyan-500/8 to-blue-500/8 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${
              mousePosition.y * 0.025
            }px)`,
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-28 h-28 bg-gradient-to-br from-pink-500/6 to-purple-500/6 rounded-full blur-xl"
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
                  <Zap className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Past Projects
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
                A collection of my most impactful machine learning (ML) and
                engineering projects, showcasing innovation across several
                domains.
              </p>
            </div>

            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden transition-all duration-500 hover:scale-105`}
                  >
                    {/* Card glow effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                        project.featured
                          ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:blur-2xl"
                          : "bg-gradient-to-br from-cyan-600/15 to-blue-600/15 group-hover:blur-xl"
                      }`}
                    ></div>

                    {/* Main card */}
                    <div
                      className={`relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-2xl border p-8 shadow-xl transition-all duration-500 ${
                        project.featured
                          ? "border-purple-500/30 hover:border-purple-400/50 group-hover:shadow-2xl group-hover:shadow-purple-500/10"
                          : "border-border/50 hover:border-cyan-500/30 group-hover:shadow-2xl group-hover:shadow-cyan-500/10"
                      }`}
                    >
                      {/* Featured badge */}
                      {project.featured && (
                        <div className="absolute top-4 right-4">
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            <Star className="w-3 h-3" />
                            <span>Featured</span>
                          </div>
                        </div>
                      )}

                      {/* Project title */}
                      <h3
                        className={`text-xl md:text-2xl font-bold mb-4 transition-colors duration-300 ${
                          project.featured
                            ? "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                            : "text-foreground group-hover:text-cyan-400"
                        }`}
                      >
                        {project.title}
                      </h3>

                      {/* Description */}
                      <p className="text-foreground/70 mb-6 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Technologies */}
                      <div className="mb-6">
                        <div className="flex items-center mb-3">
                          <Tag className="w-4 h-4 text-foreground/60 mr-2" />
                          <span className="text-sm font-medium text-foreground/60">
                            Technologies
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                project.featured
                                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30"
                              }`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Status and actions */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-foreground/60" />
                          <span
                            className={`text-sm px-3 py-1 rounded-full font-medium ${
                              project.status === "Completed"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : project.status === "Ongoing"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={
                              () =>
                                project.link?.startsWith("http")
                                  ? window.open(project.link, "_blank") // external link
                                  : project.link && (window.location.href = project.link) // internal route
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          {project.github && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="group/btn relative overflow-hidden border-cyan-500/30 hover:border-cyan-400/50 bg-background/10 backdrop-blur-sm hover:bg-cyan-500/10 transition-all duration-300"
                              onClick={() =>
                                window.open(project.github, "_blank")
                              }
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                              <Github className="w-4 h-4 relative z-10" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Projects;
