import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    id: "how-roam-works",
    question: "How does ROAM work?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        ROAM connects members with mobile service providers through a premium 
        appointment booking app. Members can browse and search for available 
        services, view service provider profiles, select a preferred provider, 
        and book appointments directly through the app on your phone or tablet.
      </p>
    ),
  },
  {
    id: "availability-area",
    question: "Is ROAM available in my area?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        ROAM is currently providing services in Florida along the Emerald Coast. 
        We plan to expand to new locations. Sign up for our{" "}
        <a 
          href="https://roamyourbestlife.com/members/#link-newsletter" 
          className="text-roam-blue font-semibold hover:underline"
        >
          emails
        </a>{" "}
        and check our app and website regularly to stay in the loop on any new 
        service areas added.
      </p>
    ),
  },
  {
    id: "available-services",
    question: "What services can I book on ROAM?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Currently ROAM offers mobile wellness and med spa services. The services 
        available in a particular area vary, so please check the app for availability. 
        We plan to expand our service offerings over time.{" "}
        <span>Sign up for our </span>
        <a 
          href="https://roamyourbestlife.com/members/#link-newsletter" 
          className="text-roam-blue font-semibold hover:underline"
        >
          emails
        </a>{" "}
        <span>
          and check our app and website regularly to stay in the loop on any 
          new services added.
        </span>
      </p>
    ),
  },
  {
    id: "become-member",
    question: "How do I become a member?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Our base membership is free. To create an account on ROAM simply download 
        the app and follow the registration process. You will be prompted to provide 
        basic information such as your name, email address, and contact details, 
        to begin booking your appointments.
      </p>
    ),
  },
  {
    id: "choose-provider",
    question: "Can I choose the service provider?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        You will have access to provider profiles, including their qualifications, 
        specialties, ratings, and reviews. You can select a preferred service 
        provider based on your preferences and availability.
      </p>
    ),
  },
  {
    id: "payment-methods",
    question: "How do I pay for services?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        ROAM provides secure payment options within the app, all you have to do 
        is add your preferred form of payment.
      </p>
    ),
  },
  {
    id: "cancel-reschedule",
    question: "Can I cancel or reschedule my appointments?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, you can cancel or reschedule your appointment through the ROAM app. 
        Please refer to the ROAM{" "}
        <a 
          href="https://roamyourbestlife.com/cancellation-policy/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-roam-blue font-semibold hover:underline"
        >
          cancellation policy
        </a>{" "}
        and{" "}
        <a
          href="https://app.termly.io/policy-viewer/policy.html?policyUUID=8bd3c211-2aaa-4626-9910-794dc2d85aff"
          target="_blank"
          rel="noopener noreferrer"
          className="text-roam-blue font-semibold hover:underline"
        >
          terms and conditions
        </a>{" "}
        for more information.
      </p>
    ),
  },
  {
    id: "data-security",
    question: "Is my personal information secure?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        We take user privacy and data security seriously using industry-standard 
        security measures to protect your personal information. For more details, 
        please refer to the{" "}
        <a 
          href="https://roamyourbestlife.com/privacy-policy-2/"
          className="text-roam-blue font-semibold hover:underline"
        >
          privacy policy.
        </a>
      </p>
    ),
  },
  {
    id: "customer-support",
    question: "How can I contact customer support?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Members can access the Help Center via the app for assistance or to submit 
        any inquiries or concerns you may have. You may also{" "}
        <a 
          href="https://roamyourbestlife.com/members/#link-popup"
          className="text-roam-blue font-semibold hover:underline"
        >
          email us here.
        </a>
      </p>
    ),
  },
  {
    id: "provider-qualifications",
    question: "Are ROAM service providers licensed and experienced?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, all our service providers are carefully vetted, licensed, and 
        experienced professionals. We ensure that they meet our strict quality 
        and certification standards.
      </p>
    ),
  },
  {
    id: "become-provider",
    question: "How can I become a ROAM service provider?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        If you are a service provider interested in joining the ROAM Team, 
        download the app and submit the requested information for review.
      </p>
    ),
  },
  {
    id: "leave-review",
    question: "How do I leave a review for my service provider?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        After receiving a service, you can rate and leave feedback for your 
        service provider through the app. Your feedback is important to help 
        us maintain high-quality standards.
      </p>
    ),
  },
  {
    id: "tip-provider",
    question: "Can I tip my provider via the app?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Yes, upon completion of the service, you are given the option in the 
        app to leave a tip for the Service Provider.
      </p>
    ),
  },
  {
    id: "news-updates",
    question: "How do I learn about ROAM's latest news and updates?",
    answer: (
      <p className="text-gray-600 leading-relaxed">
        Sign up for our{" "}
        <a 
          href="https://roamyourbestlife.com/members/#link-newsletter"
          className="text-roam-blue font-semibold hover:underline"
        >
          emails
        </a>{" "}
        and check our app and website regularly to stay in the loop on any 
        new services and service areas added.
      </p>
    ),
  },
];

interface FAQAccordionProps {
  className?: string;
}

export default function FAQAccordion({ className }: FAQAccordionProps) {
  return (
    <div className={className}>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqData.map((faq) => (
          <AccordionItem 
            key={faq.id} 
            value={faq.id}
            className="border border-roam-blue/10 rounded-lg px-6 bg-white hover:bg-gray-50/50 transition-colors"
          >
            <AccordionTrigger className="text-left font-medium text-gray-800 hover:text-roam-blue py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-0">
              <div className="pl-8">
                {faq.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
