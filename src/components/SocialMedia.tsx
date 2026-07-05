import { motion } from "framer-motion";

const SocialMediaCarousel = () => {
  const socialMediaPlatforms = [
    {
      name: "Instagram",
      url: "https://instagram.com/thrylosindia/",
      color: "from-pink-500 to-rose-500",
      icon: (
        <img
          src="/instagram.webp"
          alt="Instagram"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "Twitter",
      url: "https://twitter.com/thrylosindia/",
      color: "from-black to-gray-800",
      icon: (
        <img
          src="/twitter.webp"
          alt="Twitter"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "YouTube",
      url: "https://youtube.com/@thrylosindia/",
      color: "from-red-500 to-red-600",
      icon: (
        <img
          src="/youtube.webp"
          alt="YouTube"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "Discord",
      url: "https://discord.gg/XVZC5v6bHu",
      color: "from-indigo-500 to-indigo-600",
      icon: (
        <img
          src="/discord.webp"
          alt="Discord"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/company/thrylosindia/",
      color: "from-blue-600 to-blue-700",
      icon: (
        <img
          src="/linkedin.webp"
          alt="LinkedIn"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "Whatsapp",
      url: "https://whatsapp.com/channel/0029VbBSmHiLNSa8gJWvuA09",
      color: "from-green-500 to-green-600",
      icon: (
        <img
          src="/whatsapp.webp"
          alt="Whatsapp"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/profile.php?id=61585251273875",
      color: "from-blue-600 to-blue-700",
      icon: (
        <img
          src="/facebook.webp"
          alt="Facebook"
          className="w-10 h-10 object-contain"
        />
      ),
    },
    {
      name: "Telegram",
      url: "https://t.me/thrylosindia",
      color: "from-blue-400 to-blue-500",
      icon: (
        <img
          src="/telegram.webp"
          alt="Telegram"
          className="w-10 h-10 object-contain"
        />
      ),
    },
  ];

  // Repeat the platforms enough times so the track is wider than the viewport
  const REPEAT_COUNT = 8; // tweak if you want more/less density
  const longTrack = Array.from({ length: REPEAT_COUNT }, () => socialMediaPlatforms).flat();

  return (
    <section className="relative w-full py-2 bg-black overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap [mask-image:linear-gradient(to right,transparent,black_10%,black_90%,transparent)]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...longTrack, ...longTrack].map((platform, index) => (
            <a
              key={`track-${index}-${platform.name}`}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mr-5 align-middle"
              title={platform.name}
            >
              <span className="inline-flex w-20 h-20 items-center justify-center">
                {platform.icon}
              </span>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialMediaCarousel;
