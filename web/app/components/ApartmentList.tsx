import React, { useEffect, useState } from "react";
import styles from "../styles/ApartmentList.module.scss";
import Image from "next/image";
import LikeButton from "./LikeButton";

interface Apartment {
  id: number;
  title: string;
  price: number;
  publication_date: string;
  location: string;
  description: string;
  images: string[];
  url: string;
  number_of_rooms: number;
  surface_area: number;
  is_shared: boolean;
  has_garage: boolean;
  is_furnished: boolean;
  has_balcony: boolean;
  is_liked: boolean;
}

interface AdditionalFilters {
  is_shared: string;
  has_garage: string;
  is_furnished: string;
  has_balcony: string;
}

interface ApartmentListProps {
  data: Apartment[];
  sortType: string;
  priceRange: { min: number; max: number } | null;
  selectedLocations: string[];
  additionalFilters: AdditionalFilters;
  userId: string;
}

const ApartmentList: React.FC<ApartmentListProps> = ({
  data,
  sortType,
  priceRange,
  selectedLocations,
  additionalFilters,
  userId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [apartments, setApartments] = useState(data);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchLikedApartments();
  }, [userId]);

  const fetchLikedApartments = async () => {
    const res = await fetch(`/api/like?userId=${userId}`);

    if (res.ok) {
      const likedApartments = await res.json();
      setApartments((prevApartments) =>
        prevApartments.map((apartment) =>
          likedApartments.includes(apartment.id)
            ? { ...apartment, is_liked: true }
            : apartment
        )
      );
    } else {
      console.error("Failed to fetch liked apartments");
    }
  };

  const handleLike = async (apartmentId: number) => {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apartmentId }),
    });

    if (res.ok) {
      setApartments((prevApartments) =>
        prevApartments.map((apartment) =>
          apartment.id === apartmentId
            ? { ...apartment, is_liked: !apartment.is_liked }
            : apartment
        )
      );
    } else {
      console.error("Failed to like the apartment");
    }
  };

  const sortData = (data: Apartment[]) => {
    switch (sortType) {
      case "recent":
        return [...data].sort(
          (a, b) =>
            new Date(b.publication_date).getTime() -
            new Date(a.publication_date).getTime()
        );
      case "oldest":
        return [...data].sort(
          (a, b) =>
            new Date(a.publication_date).getTime() -
            new Date(b.publication_date).getTime()
        );
      case "price-asc":
        return [...data].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...data].sort((a, b) => b.price - a.price);
      case "location-asc":
        return [...data].sort((a, b) => a.location.localeCompare(b.location));
      case "location-desc":
        return [...data].sort((a, b) => b.location.localeCompare(a.location));
      default:
        return data;
    }
  };

  const filterDataByPrice = (data: Apartment[]) => {
    if (!priceRange) return data;
    return data.filter(
      (apartment) =>
        apartment.price >= priceRange.min && apartment.price <= priceRange.max
    );
  };

  const filterDataByLocation = (data: Apartment[]) => {
    if (selectedLocations.length === 0) return data;
    return data.filter((apartment) =>
      selectedLocations.includes(apartment.location)
    );
  };

  const filterDataByAdditionalFilters = (data: Apartment[]) => {
    return data.filter((apartment) => {
      const matchesShared =
        additionalFilters.is_shared === "" ||
        (additionalFilters.is_shared === "OUI"
          ? apartment.is_shared
          : !apartment.is_shared);
      const matchesGarage =
        additionalFilters.has_garage === "" ||
        (additionalFilters.has_garage === "OUI"
          ? apartment.has_garage
          : !apartment.has_garage);
      const matchesFurnished =
        additionalFilters.is_furnished === "" ||
        (additionalFilters.is_furnished === "OUI"
          ? apartment.is_furnished
          : !apartment.is_furnished);
      const matchesBalcony =
        additionalFilters.has_balcony === "" ||
        (additionalFilters.has_balcony === "OUI"
          ? apartment.has_balcony
          : !apartment.has_balcony);
      return (
        matchesShared && matchesGarage && matchesFurnished && matchesBalcony
      );
    });
  };

  const sortedData = sortData(apartments);
  const filteredDataByPrice = filterDataByPrice(sortedData);
  const filteredDataByLocation = filterDataByLocation(filteredDataByPrice);
  const filteredData = filterDataByAdditionalFilters(filteredDataByLocation);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 3;
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => paginate(1)} aria-label="Page 1">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={currentPage === i ? styles.active : ""}
          aria-label={`Page ${i}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          aria-label={`Page ${totalPages}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div>
      <ul className={styles.container}>
        {currentItems.map((item) => (
          <li key={item.id} className={styles.item}>
            <h2 className={styles.title}>{item.title}</h2>
            <p className={styles.price}>{item.price} €</p>
            <p className={styles.date}>
              {new Date(item.publication_date).toLocaleDateString()}
            </p>
            <p className={styles.location}>{item.location}</p>
            <p className={styles.description}>{item.description}</p>
            <p className={styles.details}>
              Nombre de pièces: {item.number_of_rooms}
            </p>
            <p className={styles.details}>Surface: {item.surface_area} m²</p>
            <p className={styles.details}>
              Colocation: {item.is_shared ? "OUI" : "NON"}
            </p>
            <p className={styles.details}>
              Garage: {item.has_garage ? "OUI" : "NON"}
            </p>
            <p className={styles.details}>
              Meublé: {item.is_furnished ? "OUI" : "NON"}
            </p>
            <p className={styles.details}>
              Balcon: {item.has_balcony ? "OUI" : "NON"}
            </p>
            <div className={styles.images}>
              {item.images.length > 0 && item.images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={item.title}
                  width={200}
                  height={200}
                />
              ))}
            </div>
            <a href={item.url} className={styles.link}>
              Lien vers l&apos;annonce
            </a>
              <div className={styles.likeButton}>
            <LikeButton
              isLiked={item.is_liked ?? false}
              onToggle={() => handleLike(item.id)}
            />
            </div>
          </li>
        ))}
      </ul>
      <div
        className={styles.pagination}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        {renderPagination()}
      </div>
    </div>
  );
};

export default ApartmentList;