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
      title: "SIDS Prediction System",
      description:
        "Developed a machine learning model to predict Sudden Infant Death Syndrome (SIDS) using healthcare data. This project combined deep learning techniques with medical domain expertise to create a diagnostic tool.",
      technologies: [
        "Python",
        "TensorFlow",
        "Healthcare Data",
        "Deep Learning",
      ],
      status: "Completed",
      link: "/blog/automating-healthcare-diagnostics",
    },
    {
      title: "Grounded SAM Object Detection",
      description:
        "Implemented and optimized the Grounded SAM model for enhanced object detection and segmentation tasks. This project focuses on combining vision transformers with grounding capabilities.",
      technologies: [
        "PyTorch",
        "Computer Vision",
        "Transformers",
        "Segmentation",
      ],
      status: "Ongoing",
      featured: true,
    },
    {
      title: "LCA Neural Networks",
      description:
        "Research and implementation of Locally Competitive Algorithms (LCAs) with accumulator neurons for sparse coding applications in neural networks.",
      technologies: ["Neural Networks", "Sparse Coding", "MATLAB", "Research"],
      status: "Research",
      link: "/blog/cracking-the-minds-code",
    },
    {
      title: "Biological Image Segmentation",
      description:
        "Computer vision system for segmenting microscopic biological images, dealing with 'invisible' patterns in cellular and bacterial imaging.",
      technologies: ["OpenCV", "Image Processing", "Biology", "Segmentation"],
      status: "Completed",
      link: "/blog/segmenting-the-invisible",
    },
    {
      title: "Wedding Website Platform",
      description:
        "Full-stack web application for couples to create and manage their wedding websites, featuring guest management and RSVP functionality.",
      technologies: ["React", "Node.js", "Database", "Full-Stack"],
      status: "Completed",
      github: "https://github.com/cargonriv/boricua.wedding",
    },
    {
      title: "Data Science Tutorials",
      description:
        "Comprehensive collection of data science tutorials and resources, covering Python programming, machine learning fundamentals, and practical applications.",
      technologies: ["Python", "Education", "Data Science", "Tutorials"],
      status: "Ongoing",
      link: "/blog/data-science-tutorials",
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
                A collection of my most impactful machine learning and
                engineering projects, showcasing innovation across healthcare,
                AI, and data science domains.
              </p>
            </div>

            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden transition-all duration-500 hover:scale-105 ${
                      project.featured ? "lg:col-span-2" : ""
                    }`}
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
                          {project.link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="group/btn relative overflow-hidden border-purple-500/30 hover:border-purple-400/50 bg-background/10 backdrop-blur-sm hover:bg-purple-500/10 transition-all duration-300"
                              onClick={() =>
                                (window.location.href = `#${project.link}`)
                              }
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                              <ExternalLink className="w-4 h-4 relative z-10" />
                            </Button>
                          )}
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
