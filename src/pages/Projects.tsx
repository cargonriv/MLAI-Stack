import Header from "@/components/Header";

const Projects = () => {
  const projects = [
    {
      title: "SIDS Prediction System",
      description: "Developed a machine learning model to predict Sudden Infant Death Syndrome (SIDS) using healthcare data. This project combined deep learning techniques with medical domain expertise to create a diagnostic tool.",
      technologies: ["Python", "TensorFlow", "Healthcare Data", "Deep Learning"],
      status: "Completed",
      link: "/blog/automating-healthcare-diagnostics"
    },
    {
      title: "Grounded SAM Object Detection",
      description: "Implemented and optimized the Grounded SAM model for enhanced object detection and segmentation tasks. This project focuses on combining vision transformers with grounding capabilities.",
      technologies: ["PyTorch", "Computer Vision", "Transformers", "Segmentation"],
      status: "Ongoing",
      featured: true
    },
    {
      title: "LCA Neural Networks",
      description: "Research and implementation of Locally Competitive Algorithms (LCAs) with accumulator neurons for sparse coding applications in neural networks.",
      technologies: ["Neural Networks", "Sparse Coding", "MATLAB", "Research"],
      status: "Research",
      link: "/blog/cracking-the-minds-code"
    },
    {
      title: "Biological Image Segmentation",
      description: "Computer vision system for segmenting microscopic biological images, dealing with 'invisible' patterns in cellular and bacterial imaging.",
      technologies: ["OpenCV", "Image Processing", "Biology", "Segmentation"],
      status: "Completed",
      link: "/blog/segmenting-the-invisible"
    },
    {
      title: "Wedding Website Platform",
      description: "Full-stack web application for couples to create and manage their wedding websites, featuring guest management and RSVP functionality.",
      technologies: ["React", "Node.js", "Database", "Full-Stack"],
      status: "Completed",
      github: "https://github.com/cargonriv/boricua.wedding"
    },
    {
      title: "Data Science Tutorials",
      description: "Comprehensive collection of data science tutorials and resources, covering Python programming, machine learning fundamentals, and practical applications.",
      technologies: ["Python", "Education", "Data Science", "Tutorials"],
      status: "Ongoing",
      link: "/blog/data-science-tutorials"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">Past Projects</h1>
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                  <div 
                    key={index} 
                    className={`bg-card p-6 rounded-lg shadow-sm border transition-all hover:shadow-md ${
                      project.featured ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    {project.featured && (
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold mb-4 inline-block">
                        Featured
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <span 
                            key={techIndex}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`text-sm px-2 py-1 rounded ${
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {project.status}
                      </span>
                      
                      <div className="flex gap-2">
                        {project.link && (
                          <a 
                            href={project.link}
                            className="text-primary hover:text-primary/80 transition-colors text-sm"
                          >
                            Read More →
                          </a>
                        )}
                        {project.github && (
                          <a 
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors text-sm"
                          >
                            GitHub →
                          </a>
                        )}
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