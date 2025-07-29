import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">About Me</h1>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-semibold mb-4">Carlos F. González Rivera, M.E.C.E., B.S.B.M.E.</h2>
                <p className="text-xl text-muted-foreground">Neuroengineer || Data Scientist || Computer Vision Researcher || Private Thoughts || Father</p>
              </div>
              
              <div className="prose prose-lg mx-auto">
                <p className="text-lg mb-6">
                  I'm a dedicated Machine Learning Engineer with expertise in developing and deploying 
                  AI solutions across various domains. My work spans from computer vision and natural 
                  language processing to reinforcement learning and predictive analytics.
                </p>
                
                <p className="text-lg mb-6">
                  Currently pursuing my Master's degree while working on cutting-edge ML projects 
                  that bridge the gap between research and practical applications. My research focuses 
                  on neuroengineering applications, particularly in healthcare diagnostics and 
                  computer vision systems.
                </p>

                <h3 className="text-2xl font-semibold mt-8 mb-4">Education</h3>
                <ul className="list-disc list-inside mb-6">
                  <li><strong>M.E.C.E.</strong> - Master of Engineering in Computer Engineering</li>
                  <li><strong>B.S.B.M.E.</strong> - Bachelor of Science in Biomedical Engineering</li>
                </ul>

                <h3 className="text-2xl font-semibold mt-8 mb-4">Expertise</h3>
                <ul className="list-disc list-inside mb-6">
                  <li>Machine Learning & Deep Learning</li>
                  <li>Computer Vision & Image Processing</li>
                  <li>Natural Language Processing</li>
                  <li>Neuroengineering & Healthcare Applications</li>
                  <li>Data Science & Analytics</li>
                  <li>Python, TensorFlow, PyTorch</li>
                </ul>

                <h3 className="text-2xl font-semibold mt-8 mb-4">Personal</h3>
                <p className="text-lg">
                  Beyond my professional work, I'm a father who enjoys exploring the intersection of 
                  technology and human experience. I believe in the power of AI to solve meaningful 
                  problems and improve lives, particularly in healthcare and accessibility.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;