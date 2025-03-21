'use client';
import React from 'react';

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h2 className="text-4xl font-bold mb-8">Privacy Policy</h2>
      <div className="prose max-w-none space-y-8">
        <div className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </div>

        <p className="text-lg">
          At Pixelynth, we value your privacy and are committed to safeguarding your personal information. This Privacy Policy is designed to inform you about how we collect, use, and disclose your personal data when you use our website, mobile apps, and related services (collectively, the “Services”).
          By accessing or using our Services, you agree to the terms outlined in this Privacy Policy. If you do not agree with any part of this policy, please refrain from using our Services.
        </p>

        <div className="bg-gray-50 p-6 rounded-md">
          <h3 className="text-xl font-semibold mb-4">Contents of This Privacy Policy:</h3>
          <ul className="list-decimal pl-5 space-y-2">
            {[
              'Privacy Policy Updates',
              'Information We Collect',
              'How We Use Your Information',
              'Sharing Your Information',
              'Data Security',
              'Retention of Your Data',
              'Your Rights Regarding Your Data',
              'Marketing Communications',
              'Data Transfers',
              'Third-Party Websites',
              "Children's Privacy",
              'Contact Information'
            ].map((item, index) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        </div>

        <section>
          <h3 className="text-2xl font-bold mt-8 mb-4">Privacy Policy Updates</h3>
          <p>
            We are committed to keeping your personal information safe, so we regularly review and update our policies. We may update this Privacy Policy from time to time, and any changes will be posted here. By continuing to use our Services after any changes are made, you accept the updated policy. Please check this page periodically to stay informed.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h3>
          <p className="mb-4">We collect various types of personal information, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="font-semibold">Account Information:</span> When you create an account, we may collect
              your name, email address, username, and password.
            </li>
            <li>
              <span className="font-semibold">Device Information:</span> We automatically collect information about
              the device you use to access our Services.
            </li>
            <li>
              <span className="font-semibold">Location Information:</span> We may collect location data, such as
              your IP address, to provide better services.
            </li>
            <li>
              <span className="font-semibold">Server Log Information:</span> We may collect location data, such as your IP address, to provide better services. This information is processed based on legitimate interests, consent, and contract performance.
            </li>
            <li>
              <span className="font-semibold">Communication Data: </span> If you contact us, we may collect information related to your inquiries or customer support requests.
            </li>
          </ul>
          
          <p className="my-4">
            We may also use cookies and similar technologies to enhance your experience on our website. 
            These tools help us recognize you as a user and improve our services. You can manage cookie 
            preferences through your browser settings, but please note that blocking cookies may limit 
            your ability to use some features of our Services.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold mt-8 mb-4">Sharing Your Information</h3>
          <p className="mb-4">We may share your personal data in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>With law enforcement or government agencies, if required by law or in good faith belief of necessity</li>
            <li>With third-party service providers who help us deliver our Services</li>
            <li>In the event of a business transaction, such as a merger or acquisition</li>
          </ul>
          <p className="mt-4">
            We take reasonable steps to ensure that third-party service providers comply with our privacy 
            practices and implement adequate security measures.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h3>
          <p className="mb-4">We may use the personal information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide and maintain our Services</li>
            <li>To improve and personalize your experience</li>
            <li>To respond to your inquiries and requests</li>
            <li>To send you relevant information about our products and services</li>
            <li>To monitor and analyze usage trends</li>
            <li>To comply with legal obligations and protect against fraud</li>
            <li>To carry out other purposes for which we obtain your consent</li>
          </ul>
        </section>

        <section>
          <h3 className="text-2xl font-bold mt-8 mb-4">Data Security</h3>
          <p className="mb-4">
            We employ various security measures to protect your personal data from unauthorized access, 
            loss, or alteration. These include encryption, access controls, and regular security audits. 
            However, no method of transmission or storage is 100% secure, and we cannot guarantee 
            absolute security.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
          <p>If you have any questions about this Privacy Policy or wish to exercise your rights regarding your personal data, please contact us at:</p>
          <div className="mt-4">
            <p className="font-semibold">Pixelynth</p>
            <p>Email: contact@pixelynth.com</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Privacy;