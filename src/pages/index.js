import React from "react";
import Head from "next/head";
import ImageEditor from "../components/ImageEditor";

const Home = () => {
  return (
    <>
      <Head>
        <title>Purple Dog Listings - AI Image Editor</title>
        <meta name="description" content="Edit and enhance your images using AI with Purple Dog Listings." />
      </Head>
      <main style={{ padding: 20 }}>
        <h1>Purple Dog Listings - AI Image Editor</h1>
        <ImageEditor />
      </main>
    </>
  );
};

export default Home;