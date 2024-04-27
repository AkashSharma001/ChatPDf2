"use client";

import { useSidebar } from "@/lib/hooks/use-sidebar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ChatModeDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    return localStorage.getItem("chatMode") || "DOCUMENT";
  });

  const router = useRouter();

  const { changeChatType } = useSidebar();

  useEffect(() => {
    localStorage.setItem("chatMode", selectedOption);
    changeChatType(selectedOption);
  }, [selectedOption]);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (option === "DOCUMENT") router.push("/document");
    else if (option === "RESEARCH") router.push("/research");
    else if (option === "DASHBOARD") router.push("/dashboard");
  };

  return (
    <>
      <div className="relative inline-block text-left text-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex appearance-none mx-3 lg:ml-0 w-[12rem] xl:w-[18rem] rounded-t-xl bg-white justify-center border-x-2 border-t-2 border-[#edf0ff] h-[2.5rem] xl:h-[3.0rem] items-center shadow leading-tight focus:outline-none focus:shadow-outline ${isOpen ? "border-b-0" : "border-b-2 rounded-b-xl"
            }`}
        >
          <div className="flex w-[10.5rem] xl:w-[16.5rem] justify-between items-center">
            {selectedOption === "DOCUMENT" ? (
              <Image
                alt="DOCUMENTImg"
                src="/documentFULLSQUARE.svg"
                className="w-8 h-8 xl:w-10 xl:h-10 font-bold"
                height={2.5}
                width={2.5}
              />
            ) : selectedOption === "RESEARCH" ? (
              <Image
                alt="RESEARCHImg"
                src="/researchFULLSQUARE.svg"
                height={2.5}
                width={2.5}
                className="w-8 h-8 xl:w-10 xl:h-10 font-bold"
              />
            ) : (
              <Image
                alt="DASHBOARDImg"
                src="/dashboardFULLSQUARE.svg"
                height={2.5}
                width={2.5}
                className="w-8 h-8 xl:w-10 xl:h-10 font-bold"
              />
            )}
            <span className="ml-2">
              {selectedOption === "DOCUMENT"
                ? "Document"
                : selectedOption === "RESEARCH"
                  ? "Research"
                  : "Dashboard"}
            </span>
            <div className="bg-[#1C48E7] rounded-lg w-7 h-7 xl:w-8 xl:h-8 ml-auto flex items-center justify-center">
              {isOpen ? (
                <Image
                  alt="collapseImg"
                  src="/COLLAPSE.svg"
                  width={1}
                  height={1}
                  className="w-4 h-4 xl:w-5 xl:h-5"
                />
              ) : (
                <Image
                  height={1}
                  width={1}
                  alt="expandImg"
                  src="/EXPAND.svg"
                  className="w-4 h-4 xl:w-5 xl:h-5"
                />
              )}
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute -left-[0.5px] py-0 w-[12.06rem] xl:w-[18.06rem] bg-white border-x-2 border-b-2 border-[#edf0ff] rounded-b-xl shadow-lg">
            {selectedOption !== "DOCUMENT" && (
              <button
                onClick={() => handleOptionClick("DOCUMENT")}
                className="block w-full px-2 py-2 text-gray-800"
              >
                <div className="flex w-[10.5rem] xl:w-[16.5rem] justify-between items-center pl-1 py-2 hover:bg-gray-100 hover:rounded-xl">
                  <Image
                    alt="DOCUMENTImg"
                    src="/documentFULLSQUARE.svg"
                    width={2.5}
                    height={2.5}
                    className="w-10 h-10  font-bold"
                  />
                  <span className="ml-2">Document</span>
                  <div className="bg-transparent rounded-lg w-8 h-8 ml-auto flex items-center justify-center">
                    <Image
                      alt="rightArrowImg"
                      src="/Right-Arrow.svg"
                      width={1.25}
                      height={1.25}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </button>
            )}
            {selectedOption !== "RESEARCH" && (
              <button
                onClick={() => handleOptionClick("RESEARCH")}
                className="block w-full px-2 py-2 text-gray-800"
              >
                <div className="flex w-[10.5rem] xl:w-[16.5rem] justify-between items-center pl-1 py-2 hover:bg-gray-100 hover:rounded-xl">
                  <Image
                    alt="RESEARCHImg"
                    src="/researchFULLSQUARE.svg"
                    width={2.5}
                    height={2.5}
                    className="w-10 h-10  font-bold"
                  />
                  <span className="ml-2">Research</span>
                  <div className="bg-transparent rounded-lg w-8 h-8 ml-auto flex items-center justify-center">
                    <Image
                      alt="rightArrowImg"
                      src="/Right-Arrow.svg"
                      width={1.25}
                      height={1.25}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </button>
            )}
            {selectedOption !== "DASHBOARD" && (
              <button
                onClick={() => handleOptionClick("DASHBOARD")}
                className="block w-full px-2 py-2 text-gray-800"
              >
                <div className="flex w-[10.5rem] xl:w-[16.5rem] justify-between items-center pl-1 py-2 hover:bg-gray-100 hover:rounded-xl">
                  <Image
                    alt="DASHBOARDImg"
                    src="/dashboardFULLSQUARE.svg"
                    width={2.5}
                    height={2.5}
                    className="w-10 h-10  font-bold"
                  />
                  <span className="ml-2">Dashboard</span>
                  <div className="bg-transparent rounded-lg w-8 h-8 ml-auto flex items-center justify-center">
                    <Image
                      alt="rightArrowImg"
                      src="/Right-Arrow.svg"
                      width={1.25}
                      height={1.25}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatModeDropdown;
