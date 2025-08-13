import Header from "@/components/Header";

const Capstone = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">Capstone Prototype</h1>
            <div className="max-w-4xl mx-auto">
              
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold mb-4">SIDS Prediction System</h2>
                <p className="text-xl text-muted-foreground">
                  Automating Healthcare Diagnostics through Machine Learning
                </p>
              </div>

              <div className="space-y-8">
                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">Project Overview</h3>
                  <p className="text-lg mb-4">
                    My capstone project focused on developing a machine learning system to predict 
                    Sudden Infant Death Syndrome (SIDS) using healthcare data. This project began 
                    in January 2024 during my final semester at Rice University and became deeply 
                    personal as my wife and I were expecting our first child.
                  </p>
                  <p className="text-lg">
                    The project aims to bridge the gap between theoretical machine learning research 
                    and practical healthcare applications, potentially saving lives through early 
                    detection and intervention.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">Technical Approach</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Machine Learning Techniques</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Deep Neural Networks</li>
                        <li>Feature Engineering</li>
                        <li>Time Series Analysis</li>
                        <li>Ensemble Methods</li>
                        <li>Cross-validation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Technologies Used</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python & TensorFlow</li>
                        <li>Healthcare Data APIs</li>
                        <li>Statistical Analysis</li>
                        <li>Data Preprocessing</li>
                        <li>Model Validation</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">Key Challenges</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold">Data Sensitivity</h4>
                      <p>Working with sensitive healthcare data required careful attention to privacy, 
                      ethical considerations, and regulatory compliance.</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Personal Impact</h4>
                      <p>The emotional weight of working on infant mortality prediction while expecting 
                      my own child added unexpected personal dimensions to the research.</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Model Validation</h4>
                      <p>Ensuring the model's reliability and avoiding false positives/negatives in 
                      such a critical healthcare application.</p>
                    </div>
                  </div>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">Results & Impact</h3>
                  <p className="text-lg mb-4">
                    The project successfully demonstrated the potential for machine learning to assist 
                    in early detection of risk factors associated with SIDS. While the model showed 
                    promising results in validation, the project emphasized the importance of 
                    responsible AI development in healthcare contexts.
                  </p>
                  <p className="text-lg">
                    This work contributes to the growing field of AI-assisted healthcare diagnostics 
                    and highlights the intersection of technology, medicine, and human experience.
                  </p>
                </section>

                <section className="bg-card p-6 rounded-lg">
                  <h3 className="text-2xl font-semibold mb-4">Future Directions</h3>
                  <ul className="list-disc list-inside space-y-2 text-lg">
                    <li>Integration with electronic health record systems</li>
                    <li>Real-time monitoring and alert systems</li>
                    <li>Collaboration with pediatric healthcare providers</li>
                    <li>Extension to other infant health conditions</li>
                    <li>Development of interpretable AI models for medical professionals</li>
                  </ul>
                </section>

                <div className="text-center mt-12 p-6 bg-primary/10 rounded-lg">
                  <p className="text-lg mb-4">
                    For more details about this project and its personal journey, read the full story:
                  </p>
                  <a 
                    href="#/blog/automating-healthcare-diagnostics"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Read Full Story
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Capstone;